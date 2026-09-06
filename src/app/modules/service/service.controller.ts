import { Request, Response } from "express";
import {
  createServiceValidationSchema,
  updateServiceValidationSchema,
} from "./service.validation";
import {
  createServiceIntoDB,
  getAllServicesFromDB,
  getSingleServiceFromDB,
  updateServiceIntoDB,
  deactivateServiceIntoDB,
} from "./service.service";

// 1. Admin creates a municipal service
export const createService = async (req: Request, res: Response) => {
  try {
    const validationResult = createServiceValidationSchema.safeParse(req.body);

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

    const service = await createServiceIntoDB(validationResult.data);

    return res.status(201).json({
      success: true,
      message: "Municipal service created successfully",
      data: service,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 2. Get all municipal services (public)
export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await getAllServicesFromDB();

    return res.status(200).json({
      success: true,
      message: "Municipal services retrieved successfully",
      data: services,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 3. Get single municipal service by ID (public)
export const getSingleService = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const service = await getSingleServiceFromDB(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Municipal service not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Municipal service retrieved successfully",
      data: service,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 4. Admin updates a municipal service
export const updateService = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validationResult = updateServiceValidationSchema.safeParse(req.body);

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

    const service = await updateServiceIntoDB(id, validationResult.data);

    return res.status(200).json({
      success: true,
      message: "Municipal service updated successfully",
      data: service,
    });
  } catch (error: any) {
    if (error.message === "Municipal service not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 5. Admin deactivates a municipal service
export const deactivateService = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const service = await deactivateServiceIntoDB(id);

    return res.status(200).json({
      success: true,
      message: "Municipal service deactivated successfully",
      data: service,
    });
  } catch (error: any) {
    if (error.message === "Municipal service not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

