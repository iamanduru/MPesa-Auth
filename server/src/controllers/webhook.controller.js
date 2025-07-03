import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const LINK_TTL_HOURS = parseInt(process.env.ACCESS_LINK_EXPIRY_HOURS ?? '24', 10);


export async function mpesaCallback(req, res, next) {
  try {
    const cb = req.body.Body?.stkCallback;
    if (!cb) {
      console.error(
        'M-Pesa Callback - Invalid payload: Missing Body.stkCallback',
        req.body
      );
      return res.status(400).json({ error: 'Invalid callback payload!' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = cb;

    console.log(
      `M-Pesa Callback - Processing CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`
    );

    const payment = await prisma.payment.findUnique({
      where: { mpesaReceipt: CheckoutRequestID },
    });
    if (!payment) {
      console.error(
        `M-Pesa Callback - Payment not found for CheckoutRequestID: ${CheckoutRequestID}`
      );
      return res.status(200).json({ error: 'Payment not found in our system!' });
    }

    let receiptNumber = payment.mpesaReceipt;
    if (CallbackMetadata?.Item) {
      const item = CallbackMetadata.Item.find(
        (i) => i.Name === 'MpesaReceiptNumber'
      );
      if (item?.Value) {
        receiptNumber = item.Value;
        console.log(
          `M-Pesa Callback - Found MpesaReceiptNumber: ${receiptNumber}`
        );
      }
    } else {
      console.warn(
        'M-Pesa Callback - No CallbackMetadata.Item found, using initial mpesaReceipt.'
      );
    }

    const status = ResultCode === 0 ? 'SUCCESS' : 'FAILED';
    console.log(`M-Pesa Callback - Updating payment status to: ${status}`);

    const updateData = {
      status,
      paidAt: new Date()
    };
    if (status === 'SUCCESS') {
      updateData.mpesaReceipt = receiptNumber;
    }

    await prisma.payment.update({
      where: { mpesaReceipt: CheckoutRequestID },
      data: updateData
    });

    if (status === 'SUCCESS') {
      const expiresAt = new Date(
        Date.now() + LINK_TTL_HOURS * 3600 * 1000
      );
      const urlToken = crypto.randomUUID();
      const deviceIP =
        req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        '';

      await prisma.accessLink.create({
        data: {
          urlToken,
          expiresAt,
          deviceIP,
          userId: payment.userId,
          paymentId: payment.id,
        },
      });
      console.log(
        `M-Pesa Callback - Access link created for user ${payment.userId} with token ${urlToken}`
      );
    }

    return res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error(
      'M-Pesa Callback - Error processing callback:',
      error
    );
    return res.status(200).json({ status: 'error', details: error.message });
  }
}


export async function c2bConfirmation(req, res) {
  console.log('C2B Confirmation:', req.body);
  return res.status(200).send('Accepted');
}


export async function c2bValidation(req, res) {
  console.log('C2B Validation:', req.body);
  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}


export async function c2bTimeout(req, res) {
  console.log('C2B Timeout:', req.body);
  return res.status(200).send('Timeout Received');
}