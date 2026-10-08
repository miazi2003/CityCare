import { Router } from "express";
import {
  createStaff,
  getAllStaff,
  getSingleStaff,
  updateStaff,
  deactivateStaff,
  getStaffByDepartment,
} from "./staff.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// Routes for /api/v1/staff (Protected: ADMIN only)
router.post("/", authMiddleware, authorizeRoles("ADMIN"), createStaff);
router.get("/", authMiddleware, authorizeRoles("ADMIN"), getAllStaff);
router.get(
  "/department/:departmentId",
  authMiddleware,
  authorizeRoles("ADMIN"),
  getStaffByDepartment
);
router.get("/:id", authMiddleware, authorizeRoles("ADMIN"), getSingleStaff);
router.patch("/:id", authMiddleware, authorizeRoles("ADMIN"), updateStaff);
router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles("ADMIN"),
  deactivateStaff
);

export default router;
