import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./app/routes";

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
  });
});

export default app;

