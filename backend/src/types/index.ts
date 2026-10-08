// Common TypeScript types and interfaces
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

// Authenticated user payload attached to Express Request
export interface IAuthUser {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
