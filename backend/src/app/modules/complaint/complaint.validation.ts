import { z } from "zod";

// Zod schema for creating a complaint (Citizen)
export const createComplaintValidationSchema = z.object({
  title: z
    .string({
      required_error: "Title is required",
    })
    .min(1, "Title is required"),
  description: z
    .string({
      required_error: "Description is required",
    })
    .min(1, "Description is required"),
  location: z
    .string({
      required_error: "Location is required",
    })
    .min(1, "Location is required"),
  categoryId: z
    .string({
      required_error: "Category ID is required",
    })
    .min(1, "Category ID is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

// Zod schema for reviewing a complaint (Admin)
export const reviewComplaintValidationSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "REJECTED"], {
    required_error: "Status must be UNDER_REVIEW or REJECTED",
  }),
});

// Zod schema for assigning staff to a complaint (Admin)
export const assignStaffValidationSchema = z.object({
  staffId: z
    .string({
      required_error: "Staff ID is required",
    })
    .min(1, "Staff ID is required"),
});

// Zod schema for updating complaint status (Staff)
export const updateComplaintStatusValidationSchema = z.object({
  status: z.enum(["IN_PROGRESS"], {
    required_error: "Status must be IN_PROGRESS",
  }),
});

// Zod schema for resolving a complaint (Staff)
export const resolveComplaintValidationSchema = z.object({
  note: z
    .string({
      required_error: "Note is required",
    })
    .min(5, "Note must be at least 5 characters")
    .max(500, "Note cannot exceed 500 characters"),
});


