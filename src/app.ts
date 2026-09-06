import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./app/routes";
import { setupSwagger } from "./app/docs/swagger";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";

const app: Application = express();

// Security and parser middlewares
app.use(helmet());
app.use(cors());

// Capture raw body for Stripe webhook signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Swagger OpenAPI Documentation: /api-docs and /api-docs.json
setupSwagger(app);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to CivicFlow API",
  });
});

// API routes (v1)
app.use("/api/v1", router);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    data: null,
  });
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;

