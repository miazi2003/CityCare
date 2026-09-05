import { z } from "zod";

// Zod schema for creating a category
export const createCategoryValidationSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  }).min(1, "Name is required"),
  description: z.string().optional(),
  slaHours: z
    .number({
      required_error: "SLA hours is required",
    })
    .int("SLA hours must be an integer")
    .positive("SLA hours must be a positive integer"),
  departmentId: z.string({
    required_error: "Department ID is required",
  }).min(1, "Department ID is required"),
});

// Zod schema for updating a category
export const updateCategoryValidationSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    description: z.string().optional(),
    slaHours: z
      .number()
      .int("SLA hours must be an integer")
      .positive("SLA hours must be a positive integer")
      .optional(),
    departmentId: z.string().min(1, "Department ID cannot be empty").optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.slaHours !== undefined ||
      data.departmentId !== undefined,
    {
      message: "At least one field must be provided for update",
    }
  );

