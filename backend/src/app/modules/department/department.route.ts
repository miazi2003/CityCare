import { Router } from "express";
import {
  createDepartment,
  getAllDepartments,
  getSingleDepartment,
  updateDepartment,
  deactivateDepartment,
} from "./department.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// Routes for /api/v1/departments
router.post("/", authMiddleware, authorizeRoles("ADMIN"), createDepartment);
router.get("/", getAllDepartments);
router.get("/:id", getSingleDepartment);
router.patch("/:id", authMiddleware, authorizeRoles("ADMIN"), updateDepartment);
router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles("ADMIN"),
  deactivateDepartment
);

export default router;
