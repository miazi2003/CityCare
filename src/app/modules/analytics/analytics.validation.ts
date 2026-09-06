import { z } from "zod";

export const dateRangeValidationSchema = z
  .object({
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
      .refine((val) => !isNaN(Date.parse(val)), "Invalid from date")
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
      .refine((val) => !isNaN(Date.parse(val)), "Invalid to date")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    {
      message: "Invalid date range",
      path: ["from"],
    }
  );

