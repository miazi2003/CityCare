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
} from "./complaint.controller";
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

// 5. View single complaint (CITIZEN, STAFF, ADMIN with ownership checks)
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("CITIZEN", "STAFF", "ADMIN"),
  getSingleComplaint
);

// 6. Admin reviews complaint
router.patch(
  "/:id/review",
  authMiddleware,
  authorizeRoles("ADMIN"),
  reviewComplaint
);

// 7. Admin assigns staff to complaint
router.patch(
  "/:id/assign",
  authMiddleware,
  authorizeRoles("ADMIN"),
  assignStaffToComplaint
);

// 8. Staff updates complaint status
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("STAFF"),
  updateComplaintStatus
);

// 9. Citizen cancels own complaint
router.patch(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  cancelComplaint
);

export default router;


