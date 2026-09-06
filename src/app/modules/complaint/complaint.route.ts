import { Router } from "express";
import {
  createComplaint,
  getMyComplaints,
  getSingleComplaint,
  getAllComplaints,
  reviewComplaint,
  cancelComplaint,
  assignStaffToComplaint,
  getAssignedComplaints,
  updateComplaintStatus,
  resolveComplaint,
  closeComplaint,
  reopenComplaint,
  getComplaintStatusHistory,
} from "./complaint.controller";
import {
  createFeedback,
  getFeedbackByComplaint,
  updateFeedback,
  deleteFeedback,
} from "../feedback/feedback.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// Routes for /api/v1/complaints

// 1. Citizen creates complaint
router.post("/", authMiddleware, authorizeRoles("CITIZEN"), createComplaint);

// 2. Admin gets all complaints
router.get("/", authMiddleware, authorizeRoles("ADMIN"), getAllComplaints);

// 3. Citizen gets own complaints (IMPORTANT: Must be before /:id)
router.get("/my", authMiddleware, authorizeRoles("CITIZEN"), getMyComplaints);

// 4. Staff gets assigned complaints (IMPORTANT: Must be before /:id)
router.get(
  "/assigned",
  authMiddleware,
  authorizeRoles("STAFF"),
  getAssignedComplaints
);

// 5. Get complaint status history (IMPORTANT: Registered before generic GET /:id)
router.get(
  "/:id/history",
  authMiddleware,
  authorizeRoles("CITIZEN", "STAFF", "ADMIN"),
  getComplaintStatusHistory
);

// 6. Get complaint feedback (IMPORTANT: Registered before generic GET /:id)
router.get(
  "/:id/feedback",
  authMiddleware,
  authorizeRoles("CITIZEN", "STAFF", "ADMIN"),
  getFeedbackByComplaint
);

// 7. View single complaint (CITIZEN, STAFF, ADMIN with ownership checks)
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("CITIZEN", "STAFF", "ADMIN"),
  getSingleComplaint
);

// 7. Admin reviews complaint
router.patch(
  "/:id/review",
  authMiddleware,
  authorizeRoles("ADMIN"),
  reviewComplaint
);

// 8. Admin assigns staff to complaint
router.patch(
  "/:id/assign",
  authMiddleware,
  authorizeRoles("ADMIN"),
  assignStaffToComplaint
);

// 9. Staff updates complaint status (ASSIGNED -> IN_PROGRESS)
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("STAFF"),
  updateComplaintStatus
);

// 10. Staff resolves complaint (IN_PROGRESS -> RESOLVED)
router.patch(
  "/:id/resolve",
  authMiddleware,
  authorizeRoles("STAFF"),
  resolveComplaint
);

// 11. Citizen confirms and closes complaint (RESOLVED -> CLOSED)
router.patch(
  "/:id/close",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  closeComplaint
);

// 12. Citizen reopens a closed complaint (CLOSED -> REOPENED)
router.patch(
  "/:id/reopen",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  reopenComplaint
);

// 14. Citizen cancels own complaint
router.patch(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  cancelComplaint
);

// 15. Citizen creates feedback for complaint
router.post(
  "/:id/feedback",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  createFeedback
);

// 16. Citizen updates feedback for complaint
router.patch(
  "/:id/feedback",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  updateFeedback
);

// 17. Citizen deletes feedback for complaint
router.delete(
  "/:id/feedback",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  deleteFeedback
);

export default router;




