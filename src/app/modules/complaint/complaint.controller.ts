import { Request, Response } from "express";
import {
  createComplaintValidationSchema,
  reviewComplaintValidationSchema,
} from "./complaint.validation";
import {
  createComplaintIntoDB,
  getMyComplaintsFromDB,
  getSingleComplaintFromDB,
  getAllComplaintsFromDB,
  reviewComplaintIntoDB,
  cancelComplaintIntoDB,
} from "./complaint.service";

// 1. Citizen creates a complaint
export const createComplaint = async (req: Request, res: Response) => {
  try {
    const validationResult = createComplaintValidationSchema.safeParse(req.body);

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

    const complaint = await createComplaintIntoDB(
      req.user!.id,
      validationResult.data
    );

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: complaint,
    });
  } catch (error: any) {
    if (error.message === "Category not found" || error.message === "Department not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Category is inactive" || error.message === "Department is inactive") {
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

// 2. Citizen views own complaints
export const getMyComplaints = async (req: Request, res: Response) => {
  try {
    const complaints = await getMyComplaintsFromDB(req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Complaints retrieved successfully",
      data: complaints,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 3. View single complaint
export const getSingleComplaint = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const complaint = await getSingleComplaintFromDB(id, req.user!);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint retrieved successfully",
      data: complaint,
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

// 4. Admin views all complaints
export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const complaints = await getAllComplaintsFromDB();

    return res.status(200).json({
      success: true,
      message: "Complaints retrieved successfully",
      data: complaints,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 5. Admin reviews a complaint
export const reviewComplaint = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const validationResult = reviewComplaintValidationSchema.safeParse(req.body);

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

    const updatedComplaint = await reviewComplaintIntoDB(
      id,
      validationResult.data.status
    );

    return res.status(200).json({
      success: true,
      message: "Complaint reviewed successfully",
      data: updatedComplaint,
    });
  } catch (error: any) {
    if (error.message === "Complaint not found") {
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

// 6. Citizen cancels own complaint
export const cancelComplaint = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const cancelledComplaint = await cancelComplaintIntoDB(id, req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Complaint cancelled successfully",
      data: cancelledComplaint,
    });
  } catch (error: any) {
    if (error.message === "Complaint not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "You do not have permission to perform this action") {
      return res.status(403).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Cannot cancel complaint at this stage") {
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

