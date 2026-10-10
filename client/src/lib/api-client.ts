import type {
  ApiClientError,
  ApiClientErrorKind,
  ApiClientResult,
  ApiClientSuccess,
  JsonValue,
} from "@/types";
import { clearAuthToken, getAuthToken } from "./token";

export type HttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers" | "method"> & {
  body?: JsonValue;
  headers?: HeadersInit;
  method?: HttpMethod;
};

type ParsedResponseBody =
  | { type: "empty" }
  | { type: "json"; value: unknown }
  | { type: "non-json"; text: string };

const getBackendUrl = (): string | null => {
  const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (!rawUrl) {
    return null;
  }
  try {
    const parsed = new URL(rawUrl);
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isApiEnvelope = (
  value: unknown
): value is { success: boolean; message: string; data: unknown } =>
  isRecord(value) &&
  typeof value.success === "boolean" &&
  typeof value.message === "string" &&
  "data" in value;

const clientError = (
  status: number | null,
  message: string,
  kind: ApiClientErrorKind
): ApiClientError => ({
  success: false,
  message,
  data: null,
  status,
  kind,
});

const getStatusFallbackMessage = (status: number, statusText?: string): string => {
  switch (status) {
    case 400:
      return "Invalid request. Please verify your submitted data.";
    case 401:
      return "Authentication required or session expired.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "A conflict occurred while processing your request.";
    case 422:
      return "Validation failed. Please verify the form details.";
    case 500:
      return "A server error occurred. Please try again later.";
    case 502:
    case 503:
    case 504:
      return "The service is temporarily unavailable. Please try again later.";
    default:
      return statusText?.trim() || "Request failed.";
  }
};

const TECHNICAL_ERROR_PATTERNS = [
  /prisma/i,
  /postgres/i,
  /syntaxerror/i,
  /typeerror/i,
  /referenceerror/i,
  /econnrefused/i,
  /cannot read/i,
  /cannot set/i,
  /sql/i,
  /stack trace/i,
  /at (?:async )?[a-z0-9_$.<>]+\s+\(/i,
];

const sanitizeErrorMessage = (
  rawMessage: string | undefined | null,
  status: number,
  statusText?: string
): string => {
  if (!rawMessage || typeof rawMessage !== "string" || !rawMessage.trim()) {
    return getStatusFallbackMessage(status, statusText);
  }

  const trimmed = rawMessage.trim();

  // Redact raw internal server / database / stack messages
  if (status >= 500) {
    const isTechnical = TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed));
    if (isTechnical || trimmed.toLowerCase() === "internal server error") {
      return getStatusFallbackMessage(status, statusText);
    }
  }

  if (TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return getStatusFallbackMessage(status, statusText);
  }

  return trimmed;
};

const extractJsonErrorMessage = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.message === "string" && value.message.trim()) {
    return value.message.trim();
  }

  if (typeof value.error === "string" && value.error.trim()) {
    return value.error.trim();
  }

  if (Array.isArray(value.errors)) {
    const joined = value.errors
      .map((e) =>
        typeof e === "string"
          ? e
          : isRecord(e) && typeof e.message === "string"
          ? e.message
          : null
      )
      .filter((msg): msg is string => Boolean(msg))
      .join(", ");
    if (joined) {
      return joined;
    }
  }

  return null;
};

const parseResponseBody = async (response: Response): Promise<ParsedResponseBody> => {
  const text = await response.text();

  if (!text.trim()) {
    return { type: "empty" };
  }

  try {
    return { type: "json", value: JSON.parse(text) as unknown };
  } catch {
    return { type: "non-json", text };
  }
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiClientResult<T>> => {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    return clientError(
      null,
      "Application configuration error: NEXT_PUBLIC_BACKEND_URL is not configured or is invalid.",
      "config"
    );
  }

  const { body, headers: requestHeaders, method = "GET", ...requestOptions } = options;
  const headers = new Headers(requestHeaders);

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const normalizedPath = path.replace(/^\/+/, "");
  let response: Response;

  try {
    response = await fetch(
      new URL(normalizedPath, `${backendUrl}/`).toString(),
      {
        ...requestOptions,
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }
    );
  } catch {
    return clientError(
      null,
      "The backend could not be reached. Please check your network connection.",
      "network"
    );
  }

  // If a protected request receives 401, clear local token and notify auth provider
  if (
    response.status === 401 &&
    !normalizedPath.startsWith("auth/login") &&
    !normalizedPath.startsWith("auth/register")
  ) {
    clearAuthToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("citycare:unauthorized"));
    }
  }

  const parsedBody = await parseResponseBody(response);

  // 1. JSON response handling
  if (parsedBody.type === "json") {
    if (isApiEnvelope(parsedBody.value)) {
      if (response.ok && parsedBody.value.success) {
        return {
          success: true,
          message: parsedBody.value.message || "Request completed successfully.",
          data: parsedBody.value.data as T,
          status: response.status,
        } satisfies ApiClientSuccess<T>;
      }

      const safeMsg = sanitizeErrorMessage(
        parsedBody.value.message,
        response.status,
        response.statusText
      );

      return clientError(response.status, safeMsg, "response");
    }

    if (response.ok) {
      return {
        success: true,
        message: "Request completed successfully.",
        data: parsedBody.value as T,
        status: response.status,
      };
    }

    const extracted = extractJsonErrorMessage(parsedBody.value);
    const safeMsg = sanitizeErrorMessage(extracted, response.status, response.statusText);
    return clientError(response.status, safeMsg, "response");
  }

  // 2. Empty response handling
  if (parsedBody.type === "empty") {
    if (response.ok) {
      return {
        success: true,
        message: "Request completed successfully.",
        data: null,
        status: response.status,
      };
    }

    return clientError(
      response.status,
      getStatusFallbackMessage(response.status, response.statusText),
      "response"
    );
  }

  // 3. Non-JSON response handling
  if (!response.ok) {
    return clientError(
      response.status,
      getStatusFallbackMessage(response.status, response.statusText),
      "response"
    );
  }

  return clientError(
    response.status,
    "The server returned an unexpected response format.",
    "response"
  );
};
