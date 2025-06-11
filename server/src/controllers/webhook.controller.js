import { PrismaClient } from "@prisma/client";
import crypto from 'crypto';

const prisma = new PrismaClient();
const LINK_TTL_HOURS = parseInt(process.env.ACCESS_LINK_EXPIRY_HOURS || '24', 10);

export async function mpesaCallback(req, res, next) {
    try {
        const cb = req.body.Body?.stkCallback;
        if(!cb) return res.status(400).json({ error: 'Invalid callback payload!'});

        const {
            MerchantRequestID,
            CheckoutRequestID,
            ResultCode,
            CallbackMetadata
        } = cb;

        const payment = await prisma.payment.findUnique({
            where: {mpesaReceipt: CheckoutRequestID }
        });
        if(!payment) {
            return res.status(404).json({ error: 'Payment not found!'});
        }

        let receiptNumber = payment.mpesaReceipt;
        if(CallbackMetadata?.item) {
            const item = CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber');
            if (item) receiptNumber = item.Value;
        }

        const status = ResultCode === 0 ? 'SUCCESS' : 'FAILED';
        await prisma.payment.update({
            where: { mpesaReceipt: CheckoutRequestID },
            data: {
                status,
                mpesaReceipt: receiptNumber,
                paidAt: new Date()
            }
        });

        if(status === 'SUCCESS'){
            const expiresAt = new Date(Date.now() + LINK_TTL_HOURS * 3600 * 1000);
            const urlToken = crypto.randomUUID();
            await prisma.accessLink.create({
                data: {
                    urlToken,
                    expiresAt,
                    deviceIP: '',
                    userId: payment.userId,
                    paymentId: payment.id
                }
            });
        }

        res.json({ status: 'received'});
    } catch (error) {
        next(error);
    }
}


export async function c2bConfirmation(req, res) {
    console.log("C2B Confirmation:", req.body);
    res.send('Accepted');
}

export async function c2bValidation(req, res) {
    console.log("C2B Validation:", req.body);
    res.send({ ResultCode: 0, ResultDesc: 'Accepted'});
}

export async function c2bTimeout(req, res) {
    console,log('C2B Timeout:', req.body);
    res.send('Timeout Received');
}