import { Router } from "express";
import { registerCitizen } from "./auth.controller";

const router = Router();

// Endpoint: POST /api/v1/auth/register
router.post("/register", registerCitizen);

export default router;

