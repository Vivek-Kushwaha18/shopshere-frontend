import { apiRequest } from "./api";
import {
  SignupData,
  LoginData,
  AuthResponse,
  User,
} from "@/types/auth";

/* =========================
   SIGNUP
========================= */

export async function signup(
  data: SignupData
): Promise<AuthResponse> {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* =========================
   LOGIN
========================= */

export async function login(
  data: LoginData
): Promise<AuthResponse> {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* =========================
   PROFILE / ME
========================= */

export async function getProfile(
  token: string
): Promise<User> {
  return apiRequest("/auth/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/* =========================
   FORGOT PASSWORD
   Backend endpoint:
   /auth/forget
========================= */

export async function forgotPassword(
  email: string
) {
  return apiRequest("/auth/forget", {
    method: "POST",
    body: JSON.stringify({
      email,
    }),
  });
}

/* =========================
   UPDATE PASSWORD
========================= */

export async function updatePassword(
  token: string,
  data: {
    password: string;
  }
) {
  return apiRequest("/auth/update-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

/* =========================
   CHANGE PASSWORD
========================= */

export async function changePassword(
  token: string,
  data: {
    current_password: string;
    new_password: string;
  }
) {
  return apiRequest("/auth/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}