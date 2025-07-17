import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables from .env file
dotenv.config();

const {
  MPESA_ENV = 'sandbox',
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL
} = process.env;

// Check required env vars and provide a clear message
const missing = [];
if (!MPESA_CONSUMER_KEY)     missing.push('MPESA_CONSUMER_KEY');
if (!MPESA_CONSUMER_SECRET)  missing.push('MPESA_CONSUMER_SECRET');
if (!MPESA_SHORTCODE)        missing.push('MPESA_SHORTCODE');
if (!MPESA_PASSKEY)          missing.push('MPESA_PASSKEY');
if (!MPESA_CALLBACK_URL)     missing.push('MPESA_CALLBACK_URL');
if (missing.length) {
  console.warn(`Missing MPESA env vars: ${missing.join(', ')}. Falling back to sandbox defaults where possible.`);
}

// Daraja API endpoints
const endpoints = {
  sandbox: {
    oauth:    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush:  'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkQuery: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
  },
  production: {
    oauth:    'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush:  'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkQuery: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
  }
};
const urls = endpoints[MPESA_ENV] || endpoints.sandbox;

// Obtain OAuth token
async function getAccessToken() {
  const key    = MPESA_CONSUMER_KEY;
  const secret = MPESA_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error('MPESA credentials are not set');
  }
  const basic = Buffer.from(`${key}:${secret}`).toString('base64');
  const { data } = await axios.get(urls.oauth, {
    headers: { Authorization: `Basic ${basic}` }
  });
  if (!data.access_token) {
    throw new Error('Failed to obtain MPESA access token');
  }
  return data.access_token;
}

// Helpers
function getTimestamp() {
  return new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
}
function getPassword(timestamp) {
  return Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
}

/**
 * Initiate an STK push
 */
export async function stkPush(phoneNumber, amount, accountRef, description) {
  const token     = await getAccessToken();
  const timestamp = getTimestamp();
  const password  = getPassword(timestamp);

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   'CustomerPayBillOnline',
    Amount:            amount,
    PartyA:            phoneNumber,
    PartyB:            MPESA_SHORTCODE,
    PhoneNumber:       phoneNumber,
    CallBackURL:       MPESA_CALLBACK_URL,
    AccountReference:  accountRef,
    TransactionDesc:   description
  };

  const response = await axios.post(urls.stkPush, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return {
    MerchantRequestID: response.data.MerchantRequestID,
    CheckoutRequestID: response.data.CheckoutRequestID
  };
}

/**
 * Query STK push status
 */
export async function queryStkStatus(checkoutRequestID) {
  const token     = await getAccessToken();
  const timestamp = getTimestamp();
  const password  = getPassword(timestamp);

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password:          password,
    Timestamp:         timestamp,
    CheckoutRequestID: checkoutRequestID
  };

  const response = await axios.post(urls.stkQuery, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}
