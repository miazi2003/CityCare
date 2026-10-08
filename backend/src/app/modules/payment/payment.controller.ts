import { Request, Response } from "express";
import {
  createPaymentSessionForServiceRequestIntoDB,
  getPaymentStatusByServiceRequestFromDB,
  processStripeWebhookFromDB,
} from "./payment.service";

// 1. Citizen creates Stripe payment session
export const createPaymentSession = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const sessionData = await createPaymentSessionForServiceRequestIntoDB(
      id,
      req.user!.id
    );

    return res.status(200).json({
      success: true,
      message: "Payment session created",
      data: sessionData,
    });
  } catch (error: any) {
    if (error.message === "Service request not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "You do not have permission to perform this action") {
      return res.status(403).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Service request is not pending payment") {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 2. Citizen / Admin views payment status
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const payment = await getPaymentStatusByServiceRequestFromDB(
      id,
      req.user!
    );

    return res.status(200).json({
      success: true,
      message: "Payment status retrieved successfully",
      data: payment,
    });
  } catch (error: any) {
    if (
      error.message === "Service request not found" ||
      error.message === "Payment record not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "You do not have permission to perform this action") {
      return res.status(403).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 3. Process Stripe Webhook
export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string | undefined;
    const rawBody = (req as any).rawBody || req.body;

    const result = await processStripeWebhookFromDB(rawBody, signature);

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Webhook verification failed",
      data: null,
    });
  }
};

