import { Router } from "express";
import {
    mpesaCallback,
    c2bConfirmation,
    c2bValidation,
    c2bTimeout
} from '../controllers/webhook.controller.js';

const router = Router();

router.post('/mpesa', mpesaCallback);

router.post('/confirmation', c2bConfirmation);
router.post('/validation', c2bValidation);
router.post('/timeout', c2bTimeout);

export default router;