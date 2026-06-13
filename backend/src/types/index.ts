export interface AuthUser {
  userId: string;
  tenantId: string;
  role: "owner" | "admin" | "agent" | string;
}

export interface JwtPayload extends AuthUser {
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
