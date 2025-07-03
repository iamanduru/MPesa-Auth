import express from 'express';
import { mpesaCallback, c2bConfirmation, c2bValidation, c2bTimeout } from '../controllers/webhook.controller.js';

const router = express.Router();

router.post('/mpesa', mpesaCallback);

router.post('/confirmation', c2bConfirmation);
router.post('/validation', c2bValidation);
router.post('/timeout', c2bTimeout);

router.post('/simulate-mpesa-callback', (req, res, next) => {
    console.log("Received simulated callback from Postman:", JSON.stringify(req.body, null, 2));
    mpesaCallback(req, res, next);
});

export default router;