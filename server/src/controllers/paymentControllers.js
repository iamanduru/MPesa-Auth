//Handles M-pesa transaction
const { initiateSTKPush } = require("../utils/mpesaUtils");

const initiateSTKPush = async (req, res) => {
    try {
       const { phoneNumber, amount } = req.body;
       const response = await initiateSTKPush(phoneNumber, amount);
       res.json(response); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//M-pesa webhook
const handleMpesaCallback = (req, res) => {
    console.log("M-pesa Callback recieved: ", JSON.stringify(req.body, null, 2));

    const CallbackData = req.body.Body.stkCallback;
    if ( !CallbackData) {
        return res.status(400).json({ error: "invalid callback data" });
    }

    if (callbackData.ResultCode === 0) {
        console.log("✅ Payment Successful:", callbackData);
      } else {
        console.log("❌ Payment Failed:", callbackData.ResultDesc);
      }

      res.status(200).send("OK");
};

module.exports = { initiateSTKPush, handleMpesaCallback};