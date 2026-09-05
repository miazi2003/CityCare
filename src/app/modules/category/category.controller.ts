import { Request, Response } from "express";
import {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
} from "./category.validation";
import {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  getSingleCategoryFromDB,
  updateCategoryIntoDB,
  deactivateCategoryIntoDB,
} from "./category.service";

// 1. Create a new category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const validationResult = createCategoryValidationSchema.safeParse(req.body);

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

    const category = await createCategoryIntoDB(validationResult.data);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error: any) {
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

// 2. Get all active categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategoriesFromDB();

    return res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 3. Get a single category by ID
export const getSingleCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const category = await getSingleCategoryFromDB(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category retrieved successfully",
      data: category,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 4. Update category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const validationResult = updateCategoryValidationSchema.safeParse(req.body);

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

    // Check if category exists
    const existingCategory = await getSingleCategoryFromDB(id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        data: null,
      });
    }

    const updatedCategory = await updateCategoryIntoDB(
      id,
      validationResult.data
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error: any) {
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

// 5. Deactivate category (soft delete)
export const deactivateCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Check if category exists
    const existingCategory = await getSingleCategoryFromDB(id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        data: null,
      });
    }

    const deactivatedCategory = await deactivateCategoryIntoDB(id);

    return res.status(200).json({
      success: true,
      message: "Category deactivated successfully",
      data: deactivatedCategory,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

