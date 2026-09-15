
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/* =========================
   TYPES
========================= */

export interface SignupData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: "customer" | "seller";
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  token: string;
  new_password: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/* =========================
   COMMON RESPONSE HANDLER
========================= */

async function handleResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!data.status) {
    console.error("API Error Response:", data);

    // let message = "Something went wrong. Please try again.";

    // Normal backend message
    // if (typeof data?.message === "string") {
      message = data.message;
    // }

    // FastAPI simple detail message
    // else if (typeof data?.detail === "string") {
    //   message = data.detail;
    // }

    // FastAPI validation errors (422)
    // else if (Array.isArray(data?.detail)) {
    //   message = data.detail
    //     .map((error: any) => {
    //       const field =
    //         error.loc?.[error.loc.length - 1] || "field";

    //       return `${field}: ${error.msg}`;
    //     })
    //     .join(", ");
    // }

    throw new Error(message);
  }

  return data;
}

/* =========================
   SIGNUP
========================= */

export async function signup(data: SignupData) {
  const url = `${API_URL}/auth/signup`;

  console.log("Signup API URL:", url);
  console.log("Signup API Data:", data);

  try {
    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
      }),
    });

    console.log("Signup API Status:", response.status);

    return await handleResponse(response);
  } catch (error) {
    console.error("Signup API Error:", error);

    throw error;
  }
}

/* =========================
   LOGIN
========================= */

export async function login(data: LoginData) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });

  const result = await handleResponse(response);

  if (result?.access_token) {
    localStorage.setItem(
      "access_token",
      result.access_token
    );
  }

  if (result?.refresh_token) {
    localStorage.setItem(
      "refresh_token",
      result.refresh_token
    );
  }

  return result;
}

/* =========================
   GET CURRENT USER
========================= */

export async function getMe() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return handleResponse(response);
}

/* =========================
   FORGET PASSWORD
========================= */

export async function forgetPassword(
  data: ForgetPasswordData
) {
  const response = await fetch(
    `${API_URL}/auth/forget`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: data.email,
      }),
    }
  );

  return handleResponse(response);
}

/* =========================
   UPDATE PASSWORD
========================= */

export async function updatePassword(
  data: UpdatePasswordData
) {
  const response = await fetch(
    `${API_URL}/auth/update-password`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        token: data.token,
        new_password: data.new_password,
      }),
    }
  );

  return handleResponse(response);
}

/* =========================
   CHANGE PASSWORD
========================= */

export async function changePassword(
  data: ChangePasswordData
) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(
    `${API_URL}/auth/change-password`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        current_password: data.current_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      }),
    }
  );

  return handleResponse(response);
}

/* =========================
   LOGOUT
========================= */

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

/* =========================
   GET ACCESS TOKEN
========================= */

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("access_token");
}
