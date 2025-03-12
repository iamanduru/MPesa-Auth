//Load environment variables
require('dotenv').config();

const config = {
    mongoURI: process.env.MONGO_URI,
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    mpesa: {
      consumerKey: process.env.MPESA_CONSUMER_KEY,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET,
      shortcode: process.env.MPESA_SHORTCODE,
      passkey: process.env.MPESA_PASSKEY,
      accountReference: process.env.M_PESA_ACCOUNT_REFERENCE || "AuthMoney",
      env: process.env.MPESA_ENV || "sandbox",
    },
  };

  module.exports = config;