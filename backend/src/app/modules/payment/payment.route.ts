import { Router } from "express";
import { handleStripeWebhook } from "./payment.controller";

const router = Router();

// Stripe Webhook Endpoint: POST /api/v1/payments/stripe/webhook
// Authenticated cryptographically via Stripe signature, NOT by JWT
router.post("/stripe/webhook", handleStripeWebhook);

export default router;

