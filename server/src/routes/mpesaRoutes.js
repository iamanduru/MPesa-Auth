const express = require("express");
const { initiateSTKPush } = require("../services/mpesaServices");

const router = express.Router();

//Route to handle STK push payment request
router.post("/stkpush", async (req, res) => {
    const { phoneNumber, amount } = req.body;

    if (!phoneNumber || !amount) {
        return res.status(400).json({ error: "Phone number and amount required!"});
    }

    try {
        const response = await initiateSTKPush(phoneNumber, amount);
        res.json({ success: true, message: "STK Push initiated", data: response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;