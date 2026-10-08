import { z } from "zod";

// Zod schema for creating a department
export const createDepartmentValidationSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  }).min(1, "Name is required"),
  description: z.string().optional(),
});

// Zod schema for updating a department
export const updateDepartmentValidationSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    {
      message: "At least one field (name or description) must be provided",
    }
  );

