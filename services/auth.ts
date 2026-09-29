import { apiFetch } from "./api";

export type UserGender =
  | "male"
  | "female"
  | "other"
  | "prefer_not_to_say";

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
  gender: UserGender | null;
  role: "customer" | "seller" | "admin";
  is_active: boolean;
  is_verified: boolean;
}

/* =========================
   SIGNUP
========================= */

export function signup(data: SignupData) {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone
        ? data.phone.trim()
        : undefined,
      password: data.password,
      role: data.role,
    }),
  });
}

/* =========================
   SEND VERIFICATION CODE
========================= */

export function sendVerificationCode(email: string) {
  const normalizedEmail = String(email)
    .trim()
    .toLowerCase();

  return apiFetch("/auth/send-verification-code", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
    }),
  });
}

/* =========================
   VERIFY EMAIL
========================= */

export function verifyEmail(data: {
  email: string;
  code: string;
}) {
  const normalizedEmail = String(data.email)
    .trim()
    .toLowerCase();

  const normalizedCode = String(data.code).trim();

  return apiFetch("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      code: normalizedCode,
    }),
  });
}

/* =========================
   LOGIN
========================= */

export function login(data: LoginData) {
  const normalizedEmail = String(data.email)
    .trim()
    .toLowerCase();

  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: data.password,
    }),
  });
}

/* =========================
   REFRESH TOKEN
========================= */

export function refreshToken(data: {
  refresh_token: string;
}) {
  return apiFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      refresh_token: data.refresh_token,
    }),
  });
}

/* =========================
   FORGOT PASSWORD
========================= */

export function forgotPassword(
  emailOrData:
    | string
    | {
        email: string;
      }
) {
  const email =
    typeof emailOrData === "string"
      ? emailOrData
      : emailOrData?.email;

  const normalizedEmail = String(email)
    .trim()
    .toLowerCase();

  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
    }),
  });
}

/* =========================
   RESET PASSWORD
========================= */

export function resetPassword(data: {
  token: string;
  new_password: string;
}) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: data.token,
      new_password: data.new_password,
    }),
  });
}

/* =========================
   GET MY PROFILE
========================= */

export function getMyProfile() {
  return apiFetch("/auth/me");
}

/* =========================
   UPDATE MY PROFILE
========================= */

export function updateMyProfile(data: {
  full_name: string;
  phone?: string | null;
  gender?: UserGender | null;
}) {
  return apiFetch("/auth/update-profile", {
    method: "PUT",
    body: JSON.stringify({
      full_name: data.full_name.trim(),
      phone: data.phone
        ? data.phone.trim()
        : null,
      gender: data.gender || null,
    }),
  });
}

/* =========================
   CHANGE EMAIL
========================= */

export function changeEmail(newEmail: string) {
  const normalizedEmail = String(newEmail)
    .trim()
    .toLowerCase();

  return apiFetch("/auth/change-email", {
    method: "POST",
    body: JSON.stringify({
      new_email: normalizedEmail,
    }),
  });
}

/* =========================
   VERIFY EMAIL CHANGE
========================= */

export function verifyEmailChange(code: string) {
  const normalizedCode = String(code).trim();

  return apiFetch("/auth/verify-email-change", {
    method: "POST",
    body: JSON.stringify({
      code: normalizedCode,
    }),
  });
}

/* =========================
   SAVE AUTH SESSION
========================= */

export function saveAuthSession(data: {
  access_token: string;
  refresh_token: string;
  user: User;
}) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "access_token",
    data.access_token
  );

  localStorage.setItem(
    "refresh_token",
    data.refresh_token
  );

  localStorage.setItem(
    "user",
    JSON.stringify(data.user)
  );

  localStorage.setItem(
    "isLoggedIn",
    "true"
  );

  window.dispatchEvent(
    new Event("auth-change")
  );
}

/* =========================
   CLEAR AUTH SESSION
========================= */

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );

  localStorage.removeItem("user");

  localStorage.removeItem(
    "isLoggedIn"
  );

  localStorage.removeItem(
    "remember_me"
  );

  window.dispatchEvent(
    new Event("auth-change")
  );
}

/* =========================
   GET STORED USER
========================= */

export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser =
    localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser
    ) as User;
  } catch (error) {
    console.error(
      "Unable to read stored user:",
      error
    );

    localStorage.removeItem("user");

    return null;
  }
}

/* =========================
   GET ACCESS TOKEN
========================= */

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    "access_token"
  );
}

/* =========================
   GET REFRESH TOKEN
========================= */

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    "refresh_token"
  );
}