import { z } from "zod";

// Zod schema for creating feedback (Citizen)
export const createFeedbackValidationSchema = z.object({
  rating: z
    .number({
      required_error: "Rating is required",
      invalid_type_error: "Rating must be a number",
    })
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .min(3, "Comment must be at least 3 characters")
    .max(500, "Comment cannot exceed 500 characters")
    .optional(),
});

// Zod schema for updating feedback (Citizen)
export const updateFeedbackValidationSchema = z
  .object({
    rating: z
      .number({
        invalid_type_error: "Rating must be a number",
      })
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot exceed 5")
      .optional(),
    comment: z
      .string()
      .min(3, "Comment must be at least 3 characters")
      .max(500, "Comment cannot exceed 500 characters")
      .optional(),
  })
  .refine(
    (data) => data.rating !== undefined || data.comment !== undefined,
    {
      message: "At least one field (rating or comment) must be provided",
    }
  );

