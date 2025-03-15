const express = require("express");
const { initiateSTKPush } = require("../services/mpesaServices");
const Transaction = require("../models/Transaction");

const router = express.Router();

//Router to handle STK Push payment request
router.post("/stkpush", async (req, res) => {
    let { phoneNumber, amount } = req.body;

    //Ensure phone number is correct
    if (!/^2547\d{8}$/.test(phoneNumber)) {
        return res.status(400).json({ error: "Invalid phone number format. Use 2547XXXXXXXX"});
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid Amount. Must be a positive number!"});
    }

    try {
        const response = await initiateSTKPush(phoneNumber, amount);
        res.json({ success: true, message: "STK Push initiated", data: response });
    } catch (error) {
        console.error("❌ STK Push Error:", error.message);
        res.status(500).json({ error: "Failed to initiate STK Push" });
    }
});

// ✅ Webhook to receive M-Pesa callback
router.post("/callback", async (req, res) => {
    console.log("📥 Received M-Pesa Callback:", JSON.stringify(req.body, null, 2));

    const callbackData = req.body.Body.stkCallback;
    
    if (!callbackData) {
        return res.status(400).json({ error: "Invalid callback data" });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

    try {
        if (ResultCode === 0) {
            // ✅ Extract transaction details from CallbackMetadata
            const amount = CallbackMetadata?.Item.find(item => item.Name === "Amount")?.Value;
            const mpesaReceiptNumber = CallbackMetadata?.Item.find(item => item.Name === "MpesaReceiptNumber")?.Value;
            const phoneNumber = CallbackMetadata?.Item.find(item => item.Name === "PhoneNumber")?.Value;
            const transactionDate = CallbackMetadata?.Item.find(item => item.Name === "TransactionDate")?.Value;

            // ✅ Save transaction in the database
            const transaction = new Transaction({
                user: "PLACEHOLDER_USER_ID", // Replace this with actual user ID logic
                mpesaRecieptNumber: mpesaReceiptNumber,
                amount: amount,
                status: "success",
                transactionDate: new Date(transactionDate),
            });

            await transaction.save();

            return res.json({ success: true, message: "Transaction recorded successfully" });
        } else {
            console.error("❌ M-Pesa Transaction Failed:", ResultDesc);
            return res.status(400).json({ error: "Transaction failed", message: ResultDesc });
        }
    } catch (error) {
        console.error("❌ Error processing callback:", error.message);
        res.status(500).json({ error: "Failed to process M-Pesa callback" });
    }
});

module.exports = router;