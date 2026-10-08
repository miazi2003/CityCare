export type IsoDateTime = string;

// Prisma Decimal values are serialized by this backend as JSON strings.
export type DecimalString = string;

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ApiResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
  data: null;
};

export type ApiResult<T> = ApiResponse<T> | ApiError;

export type ApiClientSuccess<T> = ApiResponse<T> & {
  status: number;
};

export type ApiClientEmptySuccess = ApiResponse<null> & {
  status: number;
};

export type ApiClientErrorKind = "config" | "network" | "response";

export type ApiClientError = ApiError & {
  status: number | null;
  kind: ApiClientErrorKind;
};

export type ApiClientResult<T> =
  | ApiClientSuccess<T>
  | ApiClientEmptySuccess
  | ApiClientError;
