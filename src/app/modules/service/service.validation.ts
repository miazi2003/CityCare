import { z } from "zod";

export const createServiceValidationSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  price: z
    .number({ required_error: "Price is required" })
    .positive("Price must be a positive number"),
});

export const updateServiceValidationSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  price: z
    .number()
    .positive("Price must be a positive number")
    .optional(),
  isActive: z.boolean().optional(),
});

