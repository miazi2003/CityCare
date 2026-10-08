import { Request, Response } from "express";
import { dateRangeValidationSchema } from "./analytics.validation";
import {
  getOverviewAnalyticsFromDB,
  getDepartmentPerformanceFromDB,
  getCategoryPerformanceFromDB,
  getStaffPerformanceFromDB,
  getTimeBasedComplaintAnalyticsFromDB,
  getServiceAndPaymentAnalyticsFromDB,
} from "./analytics.service";

// 1. Overall platform overview analytics
export const getOverviewAnalytics = async (req: Request, res: Response) => {
  try {
    const data = await getOverviewAnalyticsFromDB();

    return res.status(200).json({
      success: true,
      message: "Analytics overview fetched successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 2. Department-wise complaint performance
export const getDepartmentPerformance = async (req: Request, res: Response) => {
  try {
    const data = await getDepartmentPerformanceFromDB();

    return res.status(200).json({
      success: true,
      message: "Department analytics fetched successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 3. Category-wise complaint statistics
export const getCategoryPerformance = async (req: Request, res: Response) => {
  try {
    const data = await getCategoryPerformanceFromDB();

    return res.status(200).json({
      success: true,
      message: "Category analytics fetched successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 4. Staff-wise complaint performance
export const getStaffPerformance = async (req: Request, res: Response) => {
  try {
    const data = await getStaffPerformanceFromDB();

    return res.status(200).json({
      success: true,
      message: "Staff analytics fetched successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 5. Time-based complaint report
export const getTimeBasedComplaintAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const validationResult = dateRangeValidationSchema.safeParse(req.query);

    if (!validationResult.success) {
      const isRangeError = validationResult.error.errors.some(
        (err) => err.message === "Invalid date range"
      );
      const errorMessage = isRangeError
        ? "Invalid date range"
        : validationResult.error.errors.map((e) => e.message).join(", ");

      return res.status(400).json({
        success: false,
        message: errorMessage,
        data: null,
      });
    }

    const { from, to } = validationResult.data;
    const data = await getTimeBasedComplaintAnalyticsFromDB(from, to);

    return res.status(200).json({
      success: true,
      message: "Time-based complaint analytics fetched successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 6. Service & Payment analytics report
export const getServiceAndPaymentAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getServiceAndPaymentAnalyticsFromDB();

    return res.status(200).json({
      success: true,
      message: "Service and payment analytics fetched successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

