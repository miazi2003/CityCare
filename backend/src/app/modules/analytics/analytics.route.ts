import { Router } from "express";
import {
  getOverviewAnalytics,
  getDepartmentPerformance,
  getCategoryPerformance,
  getStaffPerformance,
  getTimeBasedComplaintAnalytics,
  getServiceAndPaymentAnalytics,
} from "./analytics.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// All analytics routes require authentication and ADMIN role
router.use(authMiddleware, authorizeRoles("ADMIN"));

// 1. Overview analytics
router.get("/overview", getOverviewAnalytics);

// 2. Department-wise complaint performance
router.get("/departments", getDepartmentPerformance);

// 3. Category-wise complaint statistics
router.get("/categories", getCategoryPerformance);

// 4. Staff performance
router.get("/staff", getStaffPerformance);

// 5. Time-based complaint report
router.get("/complaints", getTimeBasedComplaintAnalytics);

// 6. Service & Payment analytics
router.get("/services", getServiceAndPaymentAnalytics);

export default router;

