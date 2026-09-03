import { Router } from "express";
import { loginCitizen, registerCitizen } from "./auth.controller";

const router = Router();

// Endpoint: POST /api/v1/auth/register
router.post("/register", registerCitizen);
router.post("/login" , loginCitizen);
export default router;

