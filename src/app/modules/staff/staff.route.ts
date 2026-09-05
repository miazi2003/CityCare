import { Router } from "express";
import {
  createStaff,
  getAllStaff,
  getSingleStaff,
  updateStaff,
  deactivateStaff,
  getStaffByDepartment,
} from "./staff.controller";

const router = Router();

// Routes for /api/v1/staff
router.post("/", createStaff);
router.get("/", getAllStaff);
router.get("/department/:departmentId", getStaffByDepartment);
router.get("/:id", getSingleStaff);
router.patch("/:id", updateStaff);
router.patch("/:id/deactivate", deactivateStaff);

export default router;
