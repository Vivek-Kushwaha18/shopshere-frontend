import { apiFetch } from "./api";

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  gender:
    | "male"
    | "female"
    | "other"
    | "prefer_not_to_say"
    | null;
  role: "customer" | "seller" | "admin";
  is_active: boolean;
  is_verified: boolean;
}

export interface AdminUserUpdateData {
  full_name?: string;
  phone?: string | null;
  gender?:
    | "male"
    | "female"
    | "other"
    | "prefer_not_to_say"
    | null;
  role?: "customer" | "seller" | "admin";
  is_active?: boolean;
}

/* =========================
   GET ALL USERS
========================= */

export async function getAdminUsers() {
  return apiFetch("/auth/admin/users");
}

/* =========================
   GET ONE USER
========================= */

export async function getAdminUser(
  userId: number
) {
  return apiFetch(
    `/auth/admin/users/${userId}`
  );
}

/* =========================
   UPDATE USER
========================= */

export async function updateAdminUser(
  userId: number,
  data: AdminUserUpdateData
) {
  return apiFetch(
    `/auth/admin/users/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

/* =========================
   DELETE USER
========================= */

export async function deleteAdminUser(
  userId: number
) {
  return apiFetch(
    `/auth/admin/users/${userId}`,
    {
      method: "DELETE",
    }
  );
}

/* =========================
   ACTIVATE USER
========================= */

export async function activateUser(
  userId: number
) {
  return updateAdminUser(userId, {
    is_active: true,
  });
}

/* =========================
   DEACTIVATE USER
========================= */

export async function deactivateUser(
  userId: number
) {
  return updateAdminUser(userId, {
    is_active: false,
  });
}