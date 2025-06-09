import { Router } from 'express';
import {
  initiatePayment,
  getPaymentStatus
} from '../controllers/payment.controller.js';

const router = Router();

router.post('/initiate', initiatePayment);
router.get('/status/:checkoutRequestId', getPaymentStatus);

export default router;
