export type UserRole =
  | "customer"
  | "seller"
  | "admin";

export interface SignupData {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role: "customer" | "seller";
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
}

export interface SignupResponse {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface RefreshTokenData {
  refresh_token: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  new_password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  data: T;
}