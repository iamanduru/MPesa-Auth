import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

export async function initiatePayment(req, res, next) {
    try {
        const { filmId, amount } = req.body;
        if(!filmId || !amount) {
            return res.status(400).json({ error: 'FilId and amount are required!'});
        }

        const phoneNumber = req.user.phoneNumber;
        const { MerchantRequestID, CheckoutRequestID } = await stkPush(
            phoneNumber,
            amount
        );

        const payment = await prisma.payment.create({
            data: {
                mpesaReceipt: CheckoutRequestID,
                amount,
                phoneNumber,
                status: 'PENDING',
                userId: req.user.id
            }
        });

        res.json({
            message: 'STK Push initiated',
            merchantRequestID: MerchantRequestID,
            checkoutRequestId: CheckoutRequestID
        });
    } catch (error) {
        next(error);
    }
}

export async function getPaymentStatus(req, res, next) {
    try {
        const { checkoutRequestId } = req.params;
        if(!checkoutRequestId) {
            return res.status(400).json({ error: 'checkoutRequestId path parameter is required' });
        }

        const payment = await prisma.payment.findUnique({
            where: { mpesaReceipt: checkoutRequestId }
        });
        if(!payment) {
            return res.status(404).json({ error: 'Payment not found'});
        }
        if(payment.status !== 'PENDING') {
            return res.json({ status: payment.status, paidAt: payment.paidAt });
        }

        const statusResp = await queryStkStatus(checkoutRequestId);

        if (statusResp.ResultCode === 0) {
            await prisma.payment.update({
                where: { mpesaReceipt: checkoutRequestId },
                data: {
                    status: 'SUCCESS',
                    paidAt: new Date(),
                }
      });
    } else if (statusResp.ResultCode !== 1) {
      await prisma.payment.update({
        where: { mpesaReceipt: checkoutRequestId },
        data: { status: 'FAILED' }
      });
    }

    res.json({ checkoutRequestId, status: statusResp.ResultDesc });
    } catch (error) {
        next(error);
    }
}