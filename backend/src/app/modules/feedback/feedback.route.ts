import { Router } from "express";
import {
  createFeedback,
  getFeedbackByComplaint,
  getAllFeedback,
  updateFeedback,
  deleteFeedback,
} from "./feedback.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// 1. Admin gets all feedback: GET /api/v1/feedback
router.get("/", authMiddleware, authorizeRoles("ADMIN"), getAllFeedback);

// 2. Complaint-specific feedback endpoints: /api/v1/complaints/:id/feedback
router.post(
  "/complaints/:id/feedback",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  createFeedback
);

router.get(
  "/complaints/:id/feedback",
  authMiddleware,
  authorizeRoles("CITIZEN", "STAFF", "ADMIN"),
  getFeedbackByComplaint
);

router.patch(
  "/complaints/:id/feedback",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  updateFeedback
);

router.delete(
  "/complaints/:id/feedback",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  deleteFeedback
);

export default router;

