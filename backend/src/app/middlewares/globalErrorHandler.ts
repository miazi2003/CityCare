import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

// Sensitive terms that must never be leaked to the client
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /postgres:\/\//i,
  /postgresql:\/\//i,
  /database_url/i,
  /stripe/i,
  /bearer/i,
];

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedMessage = err.errors.map((e) => e.message).join(", ");
    return res.status(400).json({
      success: false,
      message: formattedMessage || "Validation error",
      data: null,
    });
  }

  // 2. Determine HTTP Status Code
  const statusCode =
    typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600
      ? err.statusCode
      : typeof err.status === "number" && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  // 3. Sanitize error message to prevent leaking internal/database details or secrets
  let message = err.message || "Something went wrong";

  // Redact any message containing sensitive patterns or stack information
  const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(message));
  if (isSensitive || statusCode === 500) {
    message = statusCode === 500 ? "Something went wrong" : message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

export default globalErrorHandler;

