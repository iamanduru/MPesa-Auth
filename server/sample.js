// controllers/webhook.controller.js
export async function mpesaCallback(req, res, next) {
  try {
    const { stkCallback } = req.body.Body;
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    const status = ResultCode === 0 ? 'SUCCESS' : 'FAILED';
    const paidAt = new Date();

    await prisma.payment.update({
      where: { mpesaReceipt: CheckoutRequestID },
      data: {
        status,
        paidAt,
        merchantRequestId: MerchantRequestID,
        resultDesc:        ResultDesc,
        // you can unpack CallbackMetadata.Items for Amount/Msisdn etc
      }
    });

    // Acknowledge receipt
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    next(err);
  }
}
