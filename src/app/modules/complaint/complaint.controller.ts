import { Request, Response } from "express";
import {
  createComplaintValidationSchema,
  reviewComplaintValidationSchema,
  assignStaffValidationSchema,
  updateComplaintStatusValidationSchema,
  resolveComplaintValidationSchema,
} from "./complaint.validation";
import {
  createComplaintIntoDB,
  getMyComplaintsFromDB,
  getSingleComplaintFromDB,
  getAllComplaintsFromDB,
  reviewComplaintIntoDB,
  cancelComplaintIntoDB,
  assignStaffToComplaintIntoDB,
  getAssignedComplaintsFromDB,
  updateComplaintStatusIntoDB,
  resolveComplaintIntoDB,
  closeComplaintIntoDB,
  reopenComplaintIntoDB,
  getComplaintStatusHistoryFromDB,
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
      req.user!.id,
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

// 7. Admin assigns or reassigns staff to a complaint
export const assignStaffToComplaint = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const validationResult = assignStaffValidationSchema.safeParse(req.body);

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

    const updatedComplaint = await assignStaffToComplaintIntoDB(
      id,
      req.user!.id,
      validationResult.data.staffId
    );

    return res.status(200).json({
      success: true,
      message: "Staff assigned to complaint successfully",
      data: updatedComplaint,
    });
  } catch (error: any) {
    if (
      error.message === "Complaint not found" ||
      error.message === "Staff not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (
      error.message === "Cannot assign staff to a closed complaint" ||
      error.message === "Cannot assign staff to a cancelled complaint" ||
      error.message === "Cannot assign staff to a rejected complaint" ||
      error.message === "User is not a staff member" ||
      error.message === "Staff is inactive" ||
      error.message === "Staff is not assigned to a department" ||
      error.message === "Staff does not belong to the complaint's department"
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

// 8. Staff gets complaints assigned to them
export const getAssignedComplaints = async (req: Request, res: Response) => {
  try {
    const complaints = await getAssignedComplaintsFromDB(req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Assigned complaints retrieved successfully",
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

// 9. Staff updates complaint status (ASSIGNED -> IN_PROGRESS)
export const updateComplaintStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const validationResult = updateComplaintStatusValidationSchema.safeParse(req.body);

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

    const updatedComplaint = await updateComplaintStatusIntoDB(
      id,
      req.user!.id,
      validationResult.data.status
    );

    return res.status(200).json({
      success: true,
      message: "Complaint status updated successfully",
      data: updatedComplaint,
    });
  } catch (error: any) {
    if (
      error.message === "Complaint not found" ||
      error.message === "Staff not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (
      error.message === "You are not assigned to this complaint" ||
      error.message === "Staff does not belong to the complaint's department" ||
      error.message === "You do not have permission to perform this action"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (
      error.message === "Cannot update a closed complaint" ||
      error.message === "Cannot update a cancelled complaint" ||
      error.message === "Cannot update a rejected complaint" ||
      error.message === "Invalid status transition" ||
      error.message === "Staff is inactive"
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

// 10. Staff resolves a complaint (IN_PROGRESS -> RESOLVED)
export const resolveComplaint = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const validationResult = resolveComplaintValidationSchema.safeParse(req.body);

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

    const updatedComplaint = await resolveComplaintIntoDB(
      id,
      req.user!.id,
      validationResult.data.note
    );

    return res.status(200).json({
      success: true,
      message: "Complaint resolved successfully",
      data: updatedComplaint,
    });
  } catch (error: any) {
    if (
      error.message === "Complaint not found" ||
      error.message === "Staff not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (
      error.message === "You are not assigned to this complaint" ||
      error.message === "Staff does not belong to the complaint's department" ||
      error.message === "You do not have permission to perform this action"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (
      error.message === "Cannot resolve a closed complaint" ||
      error.message === "Cannot resolve a cancelled complaint" ||
      error.message === "Cannot resolve a rejected complaint" ||
      error.message === "Complaint must be IN_PROGRESS to be resolved" ||
      error.message === "Staff is inactive"
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

// 11. Citizen confirms and closes complaint (RESOLVED -> CLOSED)
export const closeComplaint = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const updatedComplaint = await closeComplaintIntoDB(id, req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Complaint closed successfully",
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

    if (error.message === "You do not have permission to perform this action") {
      return res.status(403).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Complaint must be in RESOLVED status to be closed") {
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

// 12. Citizen reopens a closed complaint (CLOSED -> REOPENED)
export const reopenComplaint = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const updatedComplaint = await reopenComplaintIntoDB(id, req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Complaint reopened successfully",
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

    if (error.message === "You do not have permission to perform this action") {
      return res.status(403).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Only closed complaints can be reopened") {
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

// 13. Get complaint status history
export const getComplaintStatusHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const history = await getComplaintStatusHistoryFromDB(
      id,
      req.user!.id,
      req.user!.role
    );

    return res.status(200).json({
      success: true,
      message: "Complaint status history retrieved successfully",
      data: history,
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

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};



