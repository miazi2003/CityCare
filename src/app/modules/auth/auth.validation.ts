import { z } from "zod";

// Zod schema for citizen registration
export const registerValidationSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  }).min(1, "Name is required"),
  email: z.string({
    required_error: "Email is required",
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
  }).min(6, "Password must be at least 6 characters"),
});



export const loginValidationSchema = z.object({
  email : z.string({
    required_error : "Email is required"
  }).email("Email is invalid"),
  password : z.string({
    required_error : "Password is required"
  }).min(6 , "Password must be at least 6 characters")
})