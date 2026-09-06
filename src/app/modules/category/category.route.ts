import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deactivateCategory,
} from "./category.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// Routes for /api/v1/categories
router.post("/", authMiddleware, authorizeRoles("ADMIN"), createCategory);
router.get("/", getAllCategories);
router.get("/:id", getSingleCategory);
router.patch("/:id", authMiddleware, authorizeRoles("ADMIN"), updateCategory);
router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles("ADMIN"),
  deactivateCategory
);

export default router;
