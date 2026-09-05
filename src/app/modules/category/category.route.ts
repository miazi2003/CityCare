import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deactivateCategory,
} from "./category.controller";

const router = Router();

// Routes for /api/v1/categories
router.post("/", createCategory);
router.get("/", getAllCategories);
router.get("/:id", getSingleCategory);
router.patch("/:id", updateCategory);
router.patch("/:id/deactivate", deactivateCategory);

export default router;

