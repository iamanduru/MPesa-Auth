//Payment routes
const express = require("express");
const { initiateSTK, handleMpesaCallback } = require("../controllers/paymentController");

const router = express.Router();

//payment routes
router.post("/stk-push", initiateSTK);
router.post("/mpesa-callback", handleMpesaCallback);

module.exports = router;