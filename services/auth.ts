
import { apiFetch } from "./api";

// =====================================================
// TYPES
// =====================================================

export type UserRole = "customer" | "seller" | "admin";

export interface AuthUser {
  id: number | string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  is_verified?: boolean;
  is_active?: boolean;
  profile_image?: string | null;
  [key: string]: unknown;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  user: AuthUser;
  message?: string;
  success?: boolean;
}

export interface ApiResult<T> {
  success: boolean;
  status?: number;
  data: T;
}

export interface SignupRequest {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role?: "customer" | "seller";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface GoogleLoginResult {
  success?: boolean;
  requires_otp?: boolean;
  email?: string;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  user?: AuthUser;
}

export interface GoogleVerifyOtpRequest {
  email: string;
  code: string;
}

export interface GoogleResendOtpRequest {
  email: string;
}

// =====================================================
// STORAGE KEYS
// =====================================================

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";
const LOGIN_STATUS_KEY = "isLoggedIn";
const REMEMBER_ME_KEY = "remember_me";
const LOGIN_TIME_KEY = "login_time";

// =====================================================
// API RESPONSE HELPERS
// =====================================================

function unwrapResponse<T>(response: unknown): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response
  ) {
    return (response as { data: T }).data;
  }

  return response as T;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const value = error as {
      detail?: string | { msg?: string }[];
      message?: string;
    };

    if (typeof value.detail === "string") {
      return value.detail;
    }

    if (Array.isArray(value.detail)) {
      return value.detail
        .map((item) => item.msg)
        .filter(Boolean)
        .join(", ");
    }

    if (value.message) {
      return value.message;
    }
  }

  return "Something went wrong. Please try again.";
}

// =====================================================
// AUTH SESSION
// =====================================================

export function saveAuthSession(
  response: AuthResponse,
  rememberMe = false
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (
    !response?.access_token ||
    !response?.refresh_token ||
    !response?.user
  ) {
    throw new Error("Invalid authentication response.");
  }

  const storage = rememberMe ? localStorage : sessionStorage;

  // Remove stale sessions from both storage locations.
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LOGIN_STATUS_KEY);
  localStorage.removeItem(LOGIN_TIME_KEY);

  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(LOGIN_STATUS_KEY);
  sessionStorage.removeItem(LOGIN_TIME_KEY);

  storage.setItem(ACCESS_TOKEN_KEY, response.access_token);
  storage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
  storage.setItem(USER_KEY, JSON.stringify(response.user));
  storage.setItem(LOGIN_STATUS_KEY, "true");
  storage.setItem(LOGIN_TIME_KEY, new Date().toISOString());

  localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));

  window.dispatchEvent(new Event("auth-change"));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
    localStorage.getItem(REFRESH_TOKEN_KEY)
  );
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser =
    sessionStorage.getItem(USER_KEY) ||
    localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
}

export function getUserRole(): UserRole | null {
  const user = getStoredUser();

  if (
    user?.role === "customer" ||
    user?.role === "seller" ||
    user?.role === "admin"
  ) {
    return user.role;
  }

  return null;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken() && getStoredUser());
}

export function updateStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") {
    return;
  }

  const userJson = JSON.stringify(user);

  if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
    sessionStorage.setItem(USER_KEY, userJson);
  } else if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
    localStorage.setItem(USER_KEY, userJson);
  }

  window.dispatchEvent(new Event("auth-change"));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LOGIN_STATUS_KEY);
  localStorage.removeItem(LOGIN_TIME_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);

  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(LOGIN_STATUS_KEY);
  sessionStorage.removeItem(LOGIN_TIME_KEY);

  window.dispatchEvent(new Event("auth-change"));
}

// =====================================================
// ROLE-BASED REDIRECT
// =====================================================

export function getRedirectPath(role?: UserRole | null): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";

    case "seller":
      return "/seller/dashboard";

    case "customer":
    default:
      return "/";
  }
}

export function redirectByRole(role?: UserRole | null): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(getRedirectPath(role));
}

// =====================================================
// EMAIL/PASSWORD SIGNUP
// =====================================================

export async function signup(
  payload: SignupRequest
): Promise<ApiResult<unknown>> {
  try {
    const response = await apiFetch("/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response as ApiResult<unknown>;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// =====================================================
// EMAIL VERIFICATION OTP
// =====================================================

export async function sendVerificationCode(
  email: string
): Promise<ApiResult<unknown>> {
  try {
    const response = await apiFetch("/auth/send-verification-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    return response as ApiResult<unknown>;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function verifyEmail(
  payload: VerifyEmailRequest
): Promise<ApiResult<unknown>> {
  try {
    const response = await apiFetch("/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response as ApiResult<unknown>;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// =====================================================
// EMAIL/PASSWORD LOGIN
// =====================================================

export async function login(
  payload: LoginRequest
): Promise<ApiResult<AuthResponse>> {
  try {
    const response = await apiFetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response as ApiResult<AuthResponse>;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// =====================================================
// GOOGLE LOGIN / SIGNUP
// =====================================================

/**
 * Sends the Google ID token to the backend.
 *
 * Existing verified Google users receive authentication tokens.
 * New Google users receive requires_otp=true and must verify
 * the email OTP before a session is saved.
 */
export async function googleLogin(
  credential: string
): Promise<GoogleLoginResult> {
  if (!credential?.trim()) {
    throw new Error("Google credential is missing.");
  }

  try {
    const response = await apiFetch("/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential,
      }),
    });

    return unwrapResponse<GoogleLoginResult>(response);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Verifies the OTP sent after Google signup.
 * Authentication tokens are returned only after successful verification.
 */
export async function verifyGoogleOtp(
  payload: GoogleVerifyOtpRequest
): Promise<AuthResponse> {
  try {
    const response = await apiFetch("/auth/google/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return unwrapResponse<AuthResponse>(response);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Requests a fresh OTP for an unverified Google signup.
 */
export async function resendGoogleOtp(
  payload: GoogleResendOtpRequest
): Promise<GoogleLoginResult> {
  try {
    const response = await apiFetch("/auth/google/resend-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return unwrapResponse<GoogleLoginResult>(response);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// =====================================================
// TOKEN REFRESH
// =====================================================

export async function refreshAccessToken(): Promise<AuthResponse> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthSession();
    throw new Error("Your session has expired. Please log in again.");
  }

  try {
    const response = await apiFetch("/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    const result = unwrapResponse<AuthResponse>(response);

    if (
      !result?.access_token ||
      !result?.refresh_token ||
      !result?.user
    ) {
      throw new Error("Invalid token refresh response.");
    }

    const rememberMe =
      typeof window !== "undefined" &&
      localStorage.getItem(REMEMBER_ME_KEY) === "true";

    saveAuthSession(result, rememberMe);

    return result;
  } catch (error) {
    clearAuthSession();
    throw new Error(getErrorMessage(error));
  }
}

// =====================================================
// FORGOT PASSWORD
// =====================================================

export async function forgotPassword(
  email: string
): Promise<ApiResult<unknown>> {
  try {
    const response = await apiFetch("/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    return response as ApiResult<unknown>;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// =====================================================
// RESET PASSWORD
// =====================================================

export async function resetPassword(payload: {
  token: string;
  new_password: string;
}): Promise<ApiResult<unknown>> {
  try {
    const response = await apiFetch("/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response as ApiResult<unknown>;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// =====================================================
// CURRENT USER PROFILE
// =====================================================

export async function getCurrentUser(): Promise<AuthUser> {
  try {
    const response = await apiFetch("/auth/me", {
      method: "GET",
    });

    return unwrapResponse<AuthUser>(response);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// =====================================================
// PROFILE UPDATE
// =====================================================

export async function updateProfile(
  payload: {
    full_name?: string;
    phone?: string | null;
    profile_image?: string | null;
  }
): Promise<AuthUser> {
  try {
    const response = await apiFetch("/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const user = unwrapResponse<AuthUser>(response);

    if (user?.id && user?.email) {
      updateStoredUser(user);
    }

    return user;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// =====================================================
// CHANGE EMAIL
// =====================================================

export async function requestEmailChange(
  email: string
): Promise<ApiResult<unknown>> {
  try {
    const response = await apiFetch("/auth/change-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ new_email: email }),
    });

    return response as ApiResult<unknown>;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function verifyEmailChange(payload: {
  email: string;
  code: string;
}): Promise<ApiResult<unknown>> {
  try {
    const response = await apiFetch("/auth/verify-email-change", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response as ApiResult<unknown>;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// =====================================================
// LOGOUT
// =====================================================

export async function logout(): Promise<void> {
  clearAuthSession();

  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

// =====================================================
// DEFAULT EXPORT
// =====================================================

const authService = {
  signup,
  sendVerificationCode,
  verifyEmail,
  login,
  googleLogin,
  verifyGoogleOtp,
  resendGoogleOtp,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
  saveAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  getUserRole,
  isAuthenticated,
  updateStoredUser,
  clearAuthSession,
  getRedirectPath,
  redirectByRole,
  logout,
};

export default authService;
