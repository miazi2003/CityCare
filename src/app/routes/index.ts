import { Router, Request, Response } from "express";

const router = Router();

// Health check endpoint: GET /api/v1/health
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "CivicFlow API is running",
    data: null,
  });
});

export default router;

