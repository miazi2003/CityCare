import { Request, Response } from "express";
import { registerValidationSchema } from "./auth.validation";
import { registerCitizenIntoDB } from "./auth.service";

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

