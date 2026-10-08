import { z } from "zod";

export const createServiceRequestValidationSchema = z.object({
  serviceId: z.string({ required_error: "Service ID is required" }),
  location: z
    .string({ required_error: "Location is required" })
    .min(5, "Location must be at least 5 characters")
    .max(300, "Location cannot exceed 300 characters"),
  quantity: z
    .number({ required_error: "Quantity is required" })
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(20, "Quantity cannot exceed 20"),
  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),
});

export const updateServiceRequestStatusValidationSchema = z.object({
  status: z.enum(["PROCESSING", "COMPLETED", "CANCELLED"], {
    required_error: "Status is required",
  }),
});

