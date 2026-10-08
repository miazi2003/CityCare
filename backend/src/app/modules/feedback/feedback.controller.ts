import { Request, Response } from "express";
import {
  createFeedbackValidationSchema,
  updateFeedbackValidationSchema,
} from "./feedback.validation";
import {
  createFeedbackIntoDB,
  getFeedbackByComplaintFromDB,
  getAllFeedbackFromDB,
  updateFeedbackIntoDB,
  deleteFeedbackIntoDB,
} from "./feedback.service";

// 1. Citizen creates feedback
export const createFeedback = async (req: Request, res: Response) => {
  try {
    const complaintId = req.params.id as string;

    const validationResult = createFeedbackValidationSchema.safeParse(req.body);

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

    const feedback = await createFeedbackIntoDB(
      complaintId,
      req.user!.id,
      validationResult.data
    );

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
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

    if (
      error.message === "Feedback can only be submitted for closed complaints" ||
      error.message === "Feedback already exists for this complaint"
    ) {
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

// 2. Get feedback for a complaint (CITIZEN, STAFF, ADMIN)
export const getFeedbackByComplaint = async (req: Request, res: Response) => {
  try {
    const complaintId = req.params.id as string;

    const feedback = await getFeedbackByComplaintFromDB(
      complaintId,
      req.user!.id,
      req.user!.role
    );

    return res.status(200).json({
      success: true,
      message: "Feedback retrieved successfully",
      data: feedback,
    });
  } catch (error: any) {
    if (
      error.message === "Complaint not found" ||
      error.message === "Feedback not found"
    ) {
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

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 3. Admin views all feedback
export const getAllFeedback = async (req: Request, res: Response) => {
  try {
    const feedbacks = await getAllFeedbackFromDB();

    return res.status(200).json({
      success: true,
      message: "All feedback retrieved successfully",
      data: feedbacks,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 4. Citizen updates feedback
export const updateFeedback = async (req: Request, res: Response) => {
  try {
    const complaintId = req.params.id as string;

    const validationResult = updateFeedbackValidationSchema.safeParse(req.body);

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

    const updatedFeedback = await updateFeedbackIntoDB(
      complaintId,
      req.user!.id,
      validationResult.data
    );

    return res.status(200).json({
      success: true,
      message: "Feedback updated successfully",
      data: updatedFeedback,
    });
  } catch (error: any) {
    if (
      error.message === "Complaint not found" ||
      error.message === "Feedback not found"
    ) {
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

    if (error.message === "Complaint must be closed to update feedback") {
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

// 5. Citizen deletes feedback
export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const complaintId = req.params.id as string;

    await deleteFeedbackIntoDB(complaintId, req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
      data: null,
    });
  } catch (error: any) {
    if (
      error.message === "Complaint not found" ||
      error.message === "Feedback not found"
    ) {
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

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

