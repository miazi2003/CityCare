import { Router } from "express";
import {
  createService,
  getAllServices,
  getSingleService,
  updateService,
  deactivateService,
} from "./service.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// Routes for /api/v1/services

// 1. Admin creates municipal service
router.post("/", authMiddleware, authorizeRoles("ADMIN"), createService);

// 2. Public gets all municipal services
router.get("/", getAllServices);

// 3. Admin deactivates municipal service (before generic PATCH /:id)
router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles("ADMIN"),
  deactivateService
);

// 4. Public gets single municipal service
router.get("/:id", getSingleService);

// 5. Admin updates municipal service
router.patch("/:id", authMiddleware, authorizeRoles("ADMIN"), updateService);

export default router;

