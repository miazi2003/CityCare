import { Router, Request, Response } from "express";
import authRoutes from "../modules/auth/auth.route";
import departmentRoutes from "../modules/department/department.route";

const router = Router();

// Health check endpoint: GET /api/v1/health
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "CivicFlow API is running",
    data: null,
  });
});

// Auth endpoints: /api/v1/auth/*
router.use("/auth", authRoutes);

// Department endpoints: /api/v1/departments/*
router.use("/departments", departmentRoutes);

export default router;
