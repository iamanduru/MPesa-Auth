import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  requestOtp,
  verifyOtpController
} from '../controllers/auth.controller.js';

const router = Router();

// throttle OTP requests
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  message: { error: 'Too many OTP requests, please try again in a minute.' }
});

/**
 * POST /auth/request-otp
 * { phoneNumber }
 */
router.post('/request-otp', otpLimiter, requestOtp);

/**
 * POST /auth/verify-otp
 * { phoneNumber, code }
 */
router.post('/verify-otp', verifyOtpController);

export default router;
