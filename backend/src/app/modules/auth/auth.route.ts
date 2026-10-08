import { Router } from "express";
import {
  registerCitizen,
  getCurrentUser,
  loginCitizen,
  logoutUser,
  initiateGoogleAuth,
  googleAuthCallback,
  googleAuthToken,
} from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

// Endpoint: POST /api/v1/auth/register
router.post("/register", registerCitizen);

// Endpoint: POST /api/v1/auth/login
router.post("/login", loginCitizen);

// Endpoint: POST /api/v1/auth/logout
router.post("/logout", logoutUser);

// Endpoint: GET /api/v1/auth/me (Protected route)
router.get("/me", authMiddleware, getCurrentUser);

// Google OAuth 2.0 endpoints
// Endpoint: GET /api/v1/auth/google
router.get("/google", initiateGoogleAuth);

// Endpoint: GET /api/v1/auth/google/callback
router.get("/google/callback", googleAuthCallback);

// Endpoint: POST /api/v1/auth/google (direct ID token authentication)
router.post("/google", googleAuthToken);

export default router;
