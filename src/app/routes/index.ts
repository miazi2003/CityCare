import { Router, Request, Response } from "express";
import authRoutes from "../modules/auth/auth.route";
import departmentRoutes from "../modules/department/department.route";
import categoryRoutes from "../modules/category/category.route";
import staffRoutes from "../modules/staff/staff.route";
import complaintRoutes from "../modules/complaint/complaint.route";
import feedbackRoutes from "../modules/feedback/feedback.route";
import serviceRoutes from "../modules/service/service.route";
import serviceRequestRoutes from "../modules/serviceRequest/serviceRequest.route";
import paymentRoutes from "../modules/payment/payment.route";
import notificationRoutes from "../modules/notification/notification.route";

const router = Router();

// Health check endpoint: GET /api/v1/health
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "CivicFlow API is running",
    data: null,
  });
});

// Auth endpoints: /api/v1/auth/*
router.use("/auth", authRoutes);

// Department endpoints: /api/v1/departments/*
router.use("/departments", departmentRoutes);

// Category endpoints: /api/v1/categories/*
router.use("/categories", categoryRoutes);

// Staff endpoints: /api/v1/staff/*
router.use("/staff", staffRoutes);

// Complaint endpoints: /api/v1/complaints/*
router.use("/complaints", complaintRoutes);

// Feedback endpoints: /api/v1/feedback/*
router.use("/feedback", feedbackRoutes);

// Municipal Service endpoints: /api/v1/services/*
router.use("/services", serviceRoutes);

// Municipal Service Request endpoints: /api/v1/service-requests/*
router.use("/service-requests", serviceRequestRoutes);

// Payment endpoints: /api/v1/payments/*
router.use("/payments", paymentRoutes);

// Notification endpoints: /api/v1/notifications/*
router.use("/notifications", notificationRoutes);

export default router;

