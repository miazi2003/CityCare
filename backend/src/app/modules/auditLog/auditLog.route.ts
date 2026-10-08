import { Router } from "express";
import {
  getAllAuditLogs,
  getEntityAuditLogs,
} from "./auditLog.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// Routes for /api/v1/audit-logs (Strictly ADMIN only)

// 1. Get all audit logs with optional query filters
router.get("/", authMiddleware, authorizeRoles("ADMIN"), getAllAuditLogs);

// 2. Get audit trail for a specific entity
router.get(
  "/:entity/:entityId",
  authMiddleware,
  authorizeRoles("ADMIN"),
  getEntityAuditLogs
);

export default router;

