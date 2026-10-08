import { Router } from "express";
import {
  createServiceRequest,
  getMyServiceRequests,
  getAllServiceRequests,
  getSingleServiceRequest,
  updateServiceRequestStatus,
} from "./serviceRequest.controller";
import {
  createPaymentSession,
  getPaymentStatus,
} from "../payment/payment.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// Routes for /api/v1/service-requests

// 1. Citizen creates service request
router.post(
  "/",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  createServiceRequest
);

// 2. Admin gets all service requests
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN"),
  getAllServiceRequests
);

// 3. Citizen gets own service requests (IMPORTANT: Must be registered before /:id)
router.get(
  "/my",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  getMyServiceRequests
);

// 4. Citizen creates payment session (IMPORTANT: Registered before generic /:id)
router.post(
  "/:id/payment",
  authMiddleware,
  authorizeRoles("CITIZEN"),
  createPaymentSession
);

// 5. Citizen / Admin gets payment status (IMPORTANT: Registered before generic /:id)
router.get(
  "/:id/payment",
  authMiddleware,
  authorizeRoles("CITIZEN", "ADMIN"),
  getPaymentStatus
);

// 6. Admin updates service request status
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("ADMIN"),
  updateServiceRequestStatus
);

// 7. Single service request detail (CITIZEN own, ADMIN any)
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("CITIZEN", "ADMIN"),
  getSingleServiceRequest
);

export default router;

