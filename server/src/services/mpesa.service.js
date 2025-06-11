import axios from 'axios';
import base64 from 'base-64';


const {
  MPESA_ENV,
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL
} = process.env;

const urls = {
  sandbox: {
    oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkQuery: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
  },
  production: {
    oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkQuery: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
  }
}[MPESA_ENV || 'sandbox'];

async function getAccessToken() {
  const creds = base64.encode(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`);
  const { data } = await axios.get(urls.oauth, {
    headers: { Authorization: `Basic ${creds}` }
  });
  return data.access_token;
}

export async function stkPush(phoneNumber, amount) {
    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-:TZ]/g, '').slice(0,14);
    const password = base64.encode(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`);

    const payload = {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: 'FilmStream',
        TransactionDesc: 'Pay for film access'
    };

    const { data } = await axios.post(urls.stkPush, payload, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return {
        MerchantRequestID: data.MerchantRequestID,
        CheckoutRequestID: data.CheckoutRequestID
    };
}


export async function  queryStkStatus(checkoutRequestID) {
    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-:TZ]/g, '').slice(0,14);
    const password = base64.encode(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`);
    
    const payload = {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
    };

    const { data } = await axios.post(urls.stkQuery, payload, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return data;
}