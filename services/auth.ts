import { apiFetch } from "./api";

// ============================================================
// SIGNUP
// ============================================================

export function signup(data: {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role: "customer" | "seller";
}) {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || undefined,
      password: data.password,
      role: data.role,
    }),
  });
}

// ============================================================
// LOGIN
// ============================================================

export function login(data: {
  email: string;
  password: string;
}) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    }),
  });
}

// ============================================================
// PROFILE
// ============================================================

export function getProfile() {
  return apiFetch("/auth/profile");
}

// ============================================================
// UPDATE PROFILE
// ============================================================

export function updateProfile(data: {
  full_name: string;
  phone?: string;
}) {
  return apiFetch("/auth/profile", {
    method: "PUT",
    body: JSON.stringify({
      full_name: data.full_name.trim(),
      phone: data.phone?.trim() || undefined,
    }),
  });
}

// ============================================================
// CHANGE PASSWORD
// ============================================================

export function changePassword(data: {
  current_password: string;
  new_password: string;
}) {
  return apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================================
// FORGOT PASSWORD
// ============================================================

export function forgotPassword(data: {
  email: string;
}) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email: data.email.trim().toLowerCase(),
    }),
  });
}

// ============================================================
// RESET PASSWORD
// ============================================================

export function resetPassword(data: {
  token: string;
  new_password: string;
}) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================================
// SEND VERIFICATION CODE
// ============================================================

export function sendVerificationCode() {
  return apiFetch(
    "/auth/send-verification-code",
    {
      method: "POST",
    }
  );
}

// ============================================================
// VERIFY EMAIL
// ============================================================

export function verifyEmail(data: {
  code: string;
}) {
  return apiFetch(
    "/auth/verify-email",
    {
      method: "POST",
      body: JSON.stringify({
        code: data.code.trim(),
      }),
    }
  );
}

// ============================================================
// REFRESH TOKEN
// ============================================================

export function refreshToken(data: {
  refresh_token: string;
}) {
  return apiFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================================
// LOGOUT
// ============================================================

export function logout() {
  return apiFetch("/auth/logout", {
    method: "POST",
  });
}