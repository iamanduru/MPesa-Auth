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
  M_PESA_ACCOUNT_REFERENCE
} = process.env;

//generate M-pesa Access token
const getAccessToken = async () => {
    try {
      const credentials = Buffer.from(`${M_PESA_CONSUMER_KEY}:${M_PESA_CONSUMER_SECRET}`).toString("base64");
      const response = await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          headers: { Authorization: `Basic ${credentials}` },
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error("❌ Error getting access token:", error?.response?.data || error.message);
      throw new Error(error?.response?.data?.errorMessage || "Failed to get M-Pesa access token");
    }
  };

// Initialize STK Push Payment
const initiateSTKPush = async (phoneNumber, amount, transactionDesc = "Payment for services") => {
    try {
      // ✅ Ensure phone number is formatted as "2547XXXXXXXX"
      if (!/^2547\d{8}$/.test(phoneNumber)) {
        throw new Error("Invalid phone number format. Use 2547XXXXXXXX");
      }
  
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
        PhoneNumber: phoneNumber, 
        CallBackURL: M_PESA_CALLBACK_URL,
        AccountReference: M_PESA_ACCOUNT_REFERENCE || "DefaultRef", 
        TransactionDesc: transactionDesc, 
      };
  
      const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        requestBody,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
  
      return response.data;
    
    } catch (error) {
      console.error("❌ STK Push Error:", error?.response?.data || error.message);
      throw new Error(error?.response?.data?.errorMessage || "Failed to initiate STK Push");
    }
  };
  
  module.exports = { initiateSTKPush };