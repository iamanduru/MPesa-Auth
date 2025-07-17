import { Router } from 'express';
import {
  initiatePayment,
  getPaymentStatus
} from '../controllers/payment.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Endpoints for initiating and checking M-Pesa payments
 */

/**
 * @swagger
 * /payment/initiate/{slug}:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Initiate payment via M-Pesa STK Push for a film/series
 *     description: Sends an STK Push to the user's phone using a WordPress slug.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: WordPress slug of the film or series
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Customer phone in E.164 format (2547XXXXXXXX)
 *     responses:
 *       '202':
 *         description: STK Push initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 merchantRequestID:
 *                   type: string
 *                 checkoutRequestID:
 *                   type: string
 *       '400':
 *         description: Validation error (missing or invalid phoneNumber or slug)
 *       '404':
 *         description: Film not found in WordPress
 */
router.post('/initiate/:slug', initiatePayment);

/**
 * @swagger
 * /payment/status/{checkoutRequestID}:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Check payment status and retrieve access link
 *     description: Returns payment status and one-time access link if payment succeeded.
 *     parameters:
 *       - in: path
 *         name: checkoutRequestID
 *         required: true
 *         schema:
 *           type: string
 *         description: The CheckoutRequestID returned by STK Push initiation
 *     responses:
 *       '200':
 *         description: Payment status and optional access link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkoutRequestID:
 *                   type: string
 *                 status:
 *                   type: string
 *                   description: PENDING, SUCCESS, or FAILED
 *                 paidAt:
 *                   type: string
 *                   format: date-time
 *                 accessLink:
 *                   type: string
 *                   nullable: true
 *                   description: One-time streaming token if payment succeeded
 *       '400':
 *         description: Missing or invalid checkoutRequestID
 *       '404':
 *         description: Payment record not found
 */
router.get('/status/:checkoutRequestID', getPaymentStatus);

export default router;
