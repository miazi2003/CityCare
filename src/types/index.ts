// Common TypeScript types and interfaces
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

