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

