import { Request, Response } from "express";
import { loginValidationSchema, registerValidationSchema } from "./auth.validation";
import {
  registerCitizenIntoDB,
  getCurrentUserFromDB,
  loginCitizenIntoDB,
} from "./auth.service";

// Controller for citizen registration
export const registerCitizen = async (req: Request, res: Response) => {
  try {
    // 1. Validate request body against Zod schema
    const validationResult = registerValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: errorMessage,
        data: null,
      });
    }

    // 2. Register citizen into DB (client cannot provide role)
    const user = await registerCitizenIntoDB({
      name: validationResult.data.name,
      email: validationResult.data.email,
      password: validationResult.data.password,
    });

    // 3. Return successful response
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error: any) {
    // Handle expected duplicate email error
    if (error.message === "Email already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// Login Citizen
export const loginCitizen = async (req: Request, res: Response) => {
  try {
    const validationResult = loginValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: errorMessage,
        data: null,
      });
    }

    const { email, password } = validationResult.data;

    const result = await loginCitizenIntoDB({
      email,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// Controller to get current authenticated user profile
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        data: null,
      });
    }

    // Fetch user from database
    const user = await getCurrentUserFromDB(userId);

    // 1. Check if user still exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    // 2. Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
        data: null,
      });
    }

    // 3. Return current user profile (password excluded)
    return res.status(200).json({
      success: true,
      message: "Current user profile fetched successfully",
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};
