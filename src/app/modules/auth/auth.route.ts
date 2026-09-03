import { Router } from "express";
import { registerCitizen, getCurrentUser, loginCitizen } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";


const router = Router();

// Endpoint: POST /api/v1/auth/register
router.post("/register", registerCitizen);
router.post("/login" , loginCitizen)
// Endpoint: GET /api/v1/auth/me (Protected route)
router.get("/me",authMiddleware, getCurrentUser);

export default router;
