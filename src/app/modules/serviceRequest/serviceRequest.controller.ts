import { Request, Response } from "express";
import {
  createServiceRequestValidationSchema,
  updateServiceRequestStatusValidationSchema,
} from "./serviceRequest.validation";
import {
  createServiceRequestIntoDB,
  getMyServiceRequestsFromDB,
  getAllServiceRequestsFromDB,
  getSingleServiceRequestFromDB,
  updateServiceRequestStatusIntoDB,
} from "./serviceRequest.service";

// 1. Citizen creates a service request
export const createServiceRequest = async (req: Request, res: Response) => {
  try {
    const validationResult = createServiceRequestValidationSchema.safeParse(
      req.body
    );

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

    const serviceRequest = await createServiceRequestIntoDB(
      req.user!.id,
      validationResult.data
    );

    return res.status(201).json({
      success: true,
      message: "Service request created successfully",
      data: serviceRequest,
    });
  } catch (error: any) {
    if (error.message === "Municipal service not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Municipal service is inactive") {
      return res.status(400).json({
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

// 2. Citizen views own service requests
export const getMyServiceRequests = async (req: Request, res: Response) => {
  try {
    const requests = await getMyServiceRequestsFromDB(req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Service requests retrieved successfully",
      data: requests,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 3. Admin views all service requests
export const getAllServiceRequests = async (req: Request, res: Response) => {
  try {
    const requests = await getAllServiceRequestsFromDB();

    return res.status(200).json({
      success: true,
      message: "Service requests retrieved successfully",
      data: requests,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 4. View single service request by ID
export const getSingleServiceRequest = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const request = await getSingleServiceRequestFromDB(id, req.user!);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service request retrieved successfully",
      data: request,
    });
  } catch (error: any) {
    if (error.message === "You do not have permission to perform this action") {
      return res.status(403).json({
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

// 5. Admin updates service request status
export const updateServiceRequestStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;
    const validationResult =
      updateServiceRequestStatusValidationSchema.safeParse(req.body);

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

    const updated = await updateServiceRequestStatusIntoDB(
      id,
      validationResult.data.status,
      req.user?.id
    );

    return res.status(200).json({
      success: true,
      message: "Service request status updated successfully",
      data: updated,
    });
  } catch (error: any) {
    if (error.message === "Service request not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Invalid status transition") {
      return res.status(400).json({
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

