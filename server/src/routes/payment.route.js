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
 *   description: Endpoints for initiating and checking M‑Pesa payments
 */

/**
 * @swagger
 * /payment/initiate/{slug}:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Initiate payment via M‑Pesa STK Push for a film/series
 *     description: Sends an STK Push to the user's phone using a WordPress slug.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: WordPress slug of the film or series (e.g. `lovebads-series`)
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
 *                   example: STK Push initiated
 *                 merchantRequestID:
 *                   type: string
 *                   example: LRCP_12345
 *                 checkoutRequestID:
 *                   type: string
 *                   example: ws_CO_12345
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
 *     description: Returns payment status and one‑time access link if payment succeeded.
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
 *                   example: ws_CO_12345
 *                 status:
 *                   type: string
 *                   enum: [PENDING, SUCCESS, FAILED]
 *                   example: SUCCESS
 *                 paidAt:
 *                   type: string
 *                   format: date-time
 *                   example: '2025-07-16T12:34:56.789Z'
 *                 accessLink:
 *                   type: string
 *                   nullable: true
 *                   description: One-time streaming token if payment succeeded
 *                   example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
 *       '400':
 *         description: Missing or invalid checkoutRequestID
 *       '404':
 *         description: Payment record not found
 */
router.get('/status/:checkoutRequestID', getPaymentStatus);

export default router;
