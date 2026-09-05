import { Router } from "express";
import {
  createDepartment,
  getAllDepartments,
  getSingleDepartment,
  updateDepartment,
  deactivateDepartment,
} from "./department.controller";

const router = Router();

// Routes for /api/v1/departments
router.post("/", createDepartment);
router.get("/", getAllDepartments);
router.get("/:id", getSingleDepartment);
router.patch("/:id", updateDepartment);
router.patch("/:id/deactivate", deactivateDepartment);

export default router;

