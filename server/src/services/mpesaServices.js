//External service integrations
const axios = require("axios");
const crypto = require("crypto");
const moment = require("moment");
const dotenv = require("dotenv");

dotenv.config();

const {
M_PESA_CONSUMER_KEY,
  M_PESA_CONSUMER_SECRET,
  M_PESA_SHORTCODE,
  M_PESA_PASSKEY,
  M_PESA_CALLBACK_URL,
} = process.env;

//generate M-pesa Access token
const getAccessToken = async () => {
    try {
        const credentials = Buffer.from(`${M_PESA_CONSUMER_KEY}:${M_PESA_CONSUMER_SECRET}`).toString("base64");
        const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
            header: { Authorization: `Basic ${credentials}` },
        });
        return response.data.access__token;
    } catch (error) {
        console.error("❌ Error getting access token:", error.response.data);
    throw new Error("Failed to get M-Pesa access token");
    }
};

//Initialize STK Push payment
const initiateSTKPush = async (phoneNumber, amount) => {
    try {
        const accessToken = await getAccessToken();
        const timestamp = moment().format("YYYYMMDDHHmmss");
        const password = Buffer.from(`${M_PESA_SHORTCODE}${M_PESA_PASSKEY}${timestamp}`).toString("base64");

        const requestBody = {
            BusinessShortCode: M_PESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: M_PESA_SHORTCODE,
            CallBackUrl: M_PESA_CALLBACK_URL,
            AccountReference: "FilmStream",
            TransactionDesc: "Payment for Mission Impossible Production",
        };

        const response = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", requestBody, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
    } catch (error) {
        console.error("❌ STK Push Error:", error.response.data);
    throw new Error("Failed to initiate STK Push");
    }
};

module.exports = { initiateSTKPush };