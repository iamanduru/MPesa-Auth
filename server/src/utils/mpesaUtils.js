const axios = require("axios");
const moment = require("moment");
const config = require("../config/env");

// Generate M-Pesa Access Token
const getAccessToken = async () => {
  try {
    const credentials = Buffer.from(`${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`).toString("base64");
    const response = await axios.get(
      `https://${config.mpesa.env}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${credentials}` },
      }
    );
    return response.data.access_token;
  } catch (error) {
    throw new Error("❌ Error getting M-Pesa access token");
  }
};

// Initiate STK Push
const initiateSTKPush = async (phoneNumber, amount) => {
  try {
    const accessToken = await getAccessToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(`${config.mpesa.shortcode}${config.mpesa.passkey}${timestamp}`).toString("base64");

    const requestBody = {
      BusinessShortCode: config.mpesa.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: config.mpesa.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: "https://yourdomain.com/mpesa-callback", // Update this with your webhook URL
      AccountReference: config.mpesa.accountReference,
      TransactionDesc: "Payment",
    };

    const response = await axios.post(
      `https://${config.mpesa.env}.safaricom.co.ke/mpesa/stkpush/v1/processrequest`,
      requestBody,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error("❌ STK Push Error");
  }
};

module.exports = { initiateSTKPush };
