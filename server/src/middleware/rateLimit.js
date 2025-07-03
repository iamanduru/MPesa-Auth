import rateLimit from "express-rate-limit";

export const webhookLimiter = rateLimit({
    windowMs: 6 * 1000,
    max: 10,
    message: { error: 'Too many webhook requests, please try again later.'}
});