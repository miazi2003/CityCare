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
