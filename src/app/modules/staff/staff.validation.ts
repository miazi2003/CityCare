import { z } from "zod";

// Zod schema for creating a staff member (role cannot be provided by client)
export const createStaffValidationSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  }).min(1, "Name is required"),
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Invalid email address"),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(6, "Password must be at least 6 characters"),
  departmentId: z.string({
    required_error: "Department ID is required",
  }).min(1, "Department ID is required"),
});

// Zod schema for updating a staff member
export const updateStaffValidationSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    email: z.string().email("Invalid email address").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    departmentId: z.string().min(1, "Department ID cannot be empty").optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.password !== undefined ||
      data.departmentId !== undefined ||
      data.isActive !== undefined,
    {
      message: "At least one field must be provided for update",
    }
  );

