import { Router } from "express";
import {
  getMyNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getAllNotifications,
  checkSlaNotifications,
} from "./notification.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// Routes for /api/v1/notifications

// 1. Get authenticated user's notifications (IMPORTANT: Before /:id)
router.get(
  "/my",
  authMiddleware,
  authorizeRoles("CITIZEN", "STAFF", "ADMIN"),
  getMyNotifications
);

// 2. Get authenticated user's unread notifications (IMPORTANT: Before /:id)
router.get(
  "/unread",
  authMiddleware,
  authorizeRoles("CITIZEN", "STAFF", "ADMIN"),
  getUnreadNotifications
);

// 3. Mark all unread notifications as read (IMPORTANT: Before /:id)
router.patch(
  "/read-all",
  authMiddleware,
  authorizeRoles("CITIZEN", "STAFF", "ADMIN"),
  markAllNotificationsAsRead
);

// 4. Admin triggers SLA breach notification auditing (IMPORTANT: Before /:id)
router.post(
  "/check-sla",
  authMiddleware,
  authorizeRoles("ADMIN"),
  checkSlaNotifications
);

// 5. Admin gets all notifications
router.get("/", authMiddleware, authorizeRoles("ADMIN"), getAllNotifications);

// 6. Mark a single notification as read
router.patch(
  "/:id/read",
  authMiddleware,
  authorizeRoles("CITIZEN", "STAFF", "ADMIN"),
  markNotificationAsRead
);

export default router;

