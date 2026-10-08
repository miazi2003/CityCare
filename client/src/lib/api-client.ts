import type {
  ApiClientError,
  ApiClientResult,
  ApiClientSuccess,
  JsonValue,
} from "@/types";
import { getAuthToken } from "./token";

export type HttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers" | "method"> & {
  body?: JsonValue;
  headers?: HeadersInit;
  method?: HttpMethod;
};

type ParsedResponseBody =
  | { type: "empty" }
  | { type: "json"; value: unknown }
  | { type: "non-json" };

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "");

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
  kind: ApiClientError["kind"]
): ApiClientError => ({
  success: false,
  message,
  data: null,
  status,
  kind,
});

const parseResponseBody = async (response: Response): Promise<ParsedResponseBody> => {
  const text = await response.text();

  if (!text.trim()) {
    return { type: "empty" };
  }

  try {
    return { type: "json", value: JSON.parse(text) as unknown };
  } catch {
    return { type: "non-json" };
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
      "NEXT_PUBLIC_BACKEND_URL is not configured.",
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

  let response: Response;

  try {
    response = await fetch(
      new URL(path.replace(/^\/+/, ""), `${backendUrl}/`).toString(),
      {
        ...requestOptions,
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }
    );
  } catch {
    return clientError(null, "The backend could not be reached.", "network");
  }

  const parsedBody = await parseResponseBody(response);

  if (parsedBody.type === "json" && isApiEnvelope(parsedBody.value)) {
    if (response.ok && parsedBody.value.success) {
      return {
        success: true,
        message: parsedBody.value.message,
        data: parsedBody.value.data as T,
        status: response.status,
      } satisfies ApiClientSuccess<T>;
    }

    return clientError(
      response.status,
      parsedBody.value.message || response.statusText || "Request failed.",
      "response"
    );
  }

  if (parsedBody.type === "empty" && response.ok) {
    return {
      success: true,
      message: "Request completed successfully.",
      data: null,
      status: response.status,
    };
  }

  if (parsedBody.type === "non-json") {
    return clientError(
      response.status,
      response.ok
        ? "The server returned a non-JSON response."
        : response.statusText || "Request failed.",
      "response"
    );
  }

  return clientError(
    response.status,
    response.statusText || "Request failed.",
    "response"
  );
};
