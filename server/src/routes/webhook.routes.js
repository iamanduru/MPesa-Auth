import express from 'express';
import {
  mpesaCallback,
  c2bConfirmation,
  c2bValidation,
  c2bTimeout
} from '../controllers/webhook.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Endpoints for M-Pesa STK and C2B callbacks
 */

/**
 * @swagger
 * /webhook/mpesa:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: M-Pesa STK Push callback endpoint
 *     description: Receives STK Push result notifications from Safaricom Daraja API.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Acknowledged receipt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ResultCode:
 *                   type: integer
 *                 ResultDesc:
 *                   type: string
 */
router.post('/mpesa', mpesaCallback);

/**
 * @swagger
 * /webhook/simulate-mpesa-callback:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Simulate M-Pesa STK callback
 *     description: Endpoint for testing STK Push callbacks via Postman or other clients.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Acknowledged simulation
 */
router.post('/simulate-mpesa-callback', (req, res, next) => {
  console.log("Received simulated callback from Postman:", JSON.stringify(req.body, null, 2));
  mpesaCallback(req, res, next);
});

/**
 * @swagger
 * /webhook/confirmation:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: C2B transaction confirmation
 *     description: Handles Customer to Business (C2B) confirmation callbacks.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Confirmation accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ResultCode:
 *                   type: integer
 *                 ResultDesc:
 *                   type: string
 */
router.post('/confirmation', c2bConfirmation);

/**
 * @swagger
 * /webhook/validation:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: C2B transaction validation
 *     description: Validates inbound C2B transactions before confirmation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Validation response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ResultCode:
 *                   type: integer
 *                 ResultDesc:
 *                   type: string
 */
router.post('/validation', c2bValidation);

/**
 * @swagger
 * /webhook/timeout:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: C2B transaction timeout notification
 *     description: Receives timeout notifications for Customer to Business transactions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Timeout received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ResultCode:
 *                   type: integer
 *                 ResultDesc:
 *                   type: string
 */
router.post('/timeout', c2bTimeout);

export default router;
