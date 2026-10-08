import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

// 1. Authentication middleware: Verifies JWT token
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        data: null,
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
        data: null,
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, config.jwt_secret) as {
      id: string;
      role: string;
    };

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      data: null,
    });
  }
};

// 2. Authorization middleware: Verifies user role (RBAC)
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // If authMiddleware didn't attach a user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        data: null,
      });
    }

    // Check if the user's role is permitted
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
        data: null,
      });
    }

    next();
  };
};
