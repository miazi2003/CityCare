import { Request, Response } from "express";
import {
  createStaffValidationSchema,
  updateStaffValidationSchema,
} from "./staff.validation";
import {
  createStaffIntoDB,
  getAllStaffFromDB,
  getSingleStaffFromDB,
  updateStaffIntoDB,
  deactivateStaffIntoDB,
  getStaffByDepartmentFromDB,
} from "./staff.service";

// 1. Create a new staff member
export const createStaff = async (req: Request, res: Response) => {
  try {
    const validationResult = createStaffValidationSchema.safeParse(req.body);

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

    const staff = await createStaffIntoDB(validationResult.data);

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staff,
    });
  } catch (error: any) {
    if (error.message === "Email already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Department not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Department is inactive") {
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

// 2. Get all staff members
export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const staffList = await getAllStaffFromDB();

    return res.status(200).json({
      success: true,
      message: "Staff retrieved successfully",
      data: staffList,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 3. Get a single staff member by ID
export const getSingleStaff = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const staff = await getSingleStaffFromDB(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff retrieved successfully",
      data: staff,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 4. Update a staff member
export const updateStaff = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const validationResult = updateStaffValidationSchema.safeParse(req.body);

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

    const updatedStaff = await updateStaffIntoDB(id, validationResult.data);

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: updatedStaff,
    });
  } catch (error: any) {
    if (error.message === "Staff not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Email already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Department not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "Department is inactive") {
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

// 5. Deactivate a staff member (soft delete)
export const deactivateStaff = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const deactivatedStaff = await deactivateStaffIntoDB(id);

    return res.status(200).json({
      success: true,
      message: "Staff deactivated successfully",
      data: deactivatedStaff,
    });
  } catch (error: any) {
    if (error.message === "Staff not found") {
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

// 6. Get active staff members by department ID
export const getStaffByDepartment = async (req: Request, res: Response) => {
  try {
    const departmentId = req.params.departmentId as string;

    const staffList = await getStaffByDepartmentFromDB(departmentId);

    return res.status(200).json({
      success: true,
      message: "Staff retrieved successfully",
      data: staffList,
    });
  } catch (error: any) {
    if (error.message === "Department not found") {
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
