import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { createAccessLink } from '../services/link.service.js';

const prisma = new PrismaClient();
const LINK_TTL_HOURS = parseInt(process.env.ACCESS_LINK_EXPIRY_HOURS || '24', 10);

// STK Push callback handler
export async function mpesaCallback(req, res, next) {
  try {
    const cb = req.body?.Body?.stkCallback;
    if (!cb) {
      console.error('M-Pesa Callback - Invalid payload', req.body);
      return res.status(400).json({ error: 'Invalid callback payload' });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = cb;
    console.log(`Processing STK callback for ${CheckoutRequestID} (ResultCode=${ResultCode})`);

    // Fetch payment
    const payment = await prisma.payment.findUnique({
      where: { mpesaReceipt: CheckoutRequestID }
    });
    if (!payment || payment.status !== 'PENDING') {
      // No pending payment to update, acknowledge to avoid retries
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // Extract MpesaReceiptNumber if present
    let receiptNumber = payment.mpesaReceipt;
    if (Array.isArray(CallbackMetadata?.Item)) {
      const item = CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber' && i.Value);
      if (item) receiptNumber = item.Value;
    }

    const status = ResultCode === 0 ? 'SUCCESS' : 'FAILED';

    // Update payment record
    await prisma.payment.update({
      where: { mpesaReceipt: CheckoutRequestID },
      data: {
        status,
        paidAt: new Date(),
        mpesaReceipt: status === 'SUCCESS' ? receiptNumber : payment.mpesaReceipt
      }
    });

    // On success, generate one-time access link
    if (status === 'SUCCESS') {
      const existing = await prisma.accessLink.findUnique({ where: { paymentId: payment.id } });
      if (!existing) {
        const deviceIP = req.headers['x-forwarded-for'] || req.ip;
        await createAccessLink(
          payment.userId,
          payment.id,
          payment.filmId,
          deviceIP
        );
      }
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('mpesaCallback error:', err);
    // Always respond accepted to prevent Daraja retries
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

// C2B Confirmation handler
export async function c2bConfirmation(req, res) {
  try {
    const { TransID, TransAmount, MSISDN, BillRefNumber: filmId } = req.body;
    console.log('C2B Confirmation:', req.body);

    // Upsert user by phone
    let user = await prisma.user.findUnique({ where: { phoneNumber: MSISDN } });
    if (!user) {
      user = await prisma.user.create({ data: { phoneNumber: MSISDN } });
    }

    // Validate filmId presence (no local film model required)
    if (!filmId) {
      return res.status(200).json({ ResultCode: 1, ResultDesc: 'Invalid Reference' });
    }

    // Upsert payment as SUCCESS
    const payment = await prisma.payment.upsert({
      where: { mpesaReceipt: TransID },
      create: {
        mpesaReceipt: TransID,
        amount: parseFloat(TransAmount),
        phoneNumber: MSISDN,
        status: 'SUCCESS',
        paidAt: new Date(),
        userId: user.id,
        filmId
      },
      update: { status: 'SUCCESS', paidAt: new Date() }
    });

    // Create access link if missing
    let link = await prisma.accessLink.findUnique({ where: { paymentId: payment.id } });
    if (!link) {
      const deviceIP = req.headers['x-forwarded-for'] || req.ip;
      await createAccessLink(user.id, payment.id, filmId, deviceIP);
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('c2bConfirmation error:', err);
    return res.status(500).json({ ResultCode: 1, ResultDesc: 'Error processing confirmation' });
  }
}

// C2B Validation handler
export async function c2bValidation(req, res) {
  try {
    const { BillRefNumber: filmId } = req.body;
    console.log('C2B Validation:', req.body);

    // Only check that a reference was provided
    if (!filmId) {
      return res.status(200).json({ ResultCode: 1, ResultDesc: 'Invalid Reference' });
    }
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('c2bValidation error:', err);
    return res.status(500).json({ ResultCode: 1, ResultDesc: 'Validation Error' });
  }
}

// C2B Timeout handler
export async function c2bTimeout(req, res) {
  console.warn('C2B Timeout:', req.body);
  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Timeout Received' });
}
