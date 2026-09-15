
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

async function handleResponse(response: Response) {
  const data = await response.json().catch(function () {
    return null;
  });

  if (response.ok) {
    return data;
  }

  if (data && typeof data.message === "string") {
    throw new Error(data.message);
  }

  if (data && typeof data.detail === "string") {
    throw new Error(data.detail);
  }

  if (data && Array.isArray(data.detail)) {
    const message = data.detail
      .map(function (error: any) {
        const field =
          error.loc && error.loc.length > 0
            ? error.loc[error.loc.length - 1]
            : "field";

        return field + ": " + error.msg;
      })
      .join(", ");

    throw new Error(message);
  }

  throw new Error(
    "Something went wrong. Please try again."
  );
}

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

export async function login(data: LoginData) {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    }
  );

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

export async function getMe() {
  const token =
    localStorage.getItem("access_token");

  if (!token) {
    throw new Error(
      "You are not logged in."
    );
  }

  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return handleResponse(response);
}

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

export async function changePassword(
  data: ChangePasswordData
) {
  const token =
    localStorage.getItem("access_token");

  if (!token) {
    throw new Error(
      "You are not logged in."
    );
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
        current_password:
          data.current_password,
        new_password:
          data.new_password,
        confirm_password:
          data.confirm_password,
      }),
    }
  );

  return handleResponse(response);
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    "access_token"
  );
}
