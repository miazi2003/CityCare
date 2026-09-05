import { Request, Response } from "express";
import {
  createDepartmentValidationSchema,
  updateDepartmentValidationSchema,
} from "./department.validation";
import {
  createDepartmentIntoDB,
  getAllDepartmentsFromDB,
  getSingleDepartmentFromDB,
  updateDepartmentIntoDB,
  deactivateDepartmentIntoDB,
} from "./department.service";

// 1. Create a new department
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const validationResult = createDepartmentValidationSchema.safeParse(req.body);

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

    const department = await createDepartmentIntoDB(validationResult.data);

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error: any) {
    // Handle Prisma unique constraint error on name
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Department with this name already exists",
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

// 2. Get all active departments
export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await getAllDepartmentsFromDB();

    return res.status(200).json({
      success: true,
      message: "Departments retrieved successfully",
      data: departments,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 3. Get single department by ID
export const getSingleDepartment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const department = await getSingleDepartmentFromDB(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Department retrieved successfully",
      data: department,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 4. Update department
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const validationResult = updateDepartmentValidationSchema.safeParse(req.body);

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

    // Check if department exists
    const existingDepartment = await getSingleDepartmentFromDB(id);

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
        data: null,
      });
    }

    const updatedDepartment = await updateDepartmentIntoDB(
      id,
      validationResult.data
    );

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: updatedDepartment,
    });
  } catch (error: any) {
    // Handle Prisma unique constraint error on name
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Department with this name already exists",
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

// 5. Deactivate department (soft delete)
export const deactivateDepartment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Check if department exists
    const existingDepartment = await getSingleDepartmentFromDB(id);

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
        data: null,
      });
    }

    const deactivatedDepartment = await deactivateDepartmentIntoDB(id);

    return res.status(200).json({
      success: true,
      message: "Department deactivated successfully",
      data: deactivatedDepartment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

