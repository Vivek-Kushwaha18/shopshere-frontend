export type UserRole =
  | "customer"
  | "seller"
  | "admin";

export interface SignupData {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id?: number;
  full_name?: string;
  email: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  user?: User;
  message?: string;
}