const API_URL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
  ? "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

type RefreshResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: unknown;
};

const LOGOUT_EVENT_KEY = "shopsphere_auth_logout";
let refreshRequest: Promise<RefreshResponse | null> | null = null;

function getStoredValue(key: string): string | null {
  return (
    sessionStorage.getItem(key) ||
    localStorage.getItem(key)
  );
}

export function refreshAuthSession(): Promise<RefreshResponse | null> {
  if (refreshRequest) {
    return refreshRequest;
  }

  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  const persistentSession =
    localStorage.getItem("remember_me") === "true";
  const logoutEventAtStart =
    localStorage.getItem(LOGOUT_EVENT_KEY);
  const sessionRefreshToken =
    sessionStorage.getItem("refresh_token");
  const localRefreshToken =
    localStorage.getItem("refresh_token");
  const refreshToken =
    sessionRefreshToken || localRefreshToken;
  const refreshStorage = sessionRefreshToken
    ? sessionStorage
    : localRefreshToken
      ? localStorage
      : null;

  if (!refreshToken && !persistentSession) {
    return Promise.resolve(null);
  }

  refreshRequest = (async () => {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
        remember_me: persistentSession,
      }),
    });

    const text = await response.text();
    if (
      localStorage.getItem(LOGOUT_EVENT_KEY) !== logoutEventAtStart ||
      (persistentSession &&
        localStorage.getItem("remember_me") !== "true")
    ) {
      return null;
    }

    let data: RefreshResponse = {};

    try {
      data = text ? (JSON.parse(text) as RefreshResponse) : {};
    } catch {
      return null;
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuth();
      }
      return null;
    }

    if (
      !data.access_token ||
      (!data.refresh_token && !persistentSession)
    ) {
      return null;
    }

    if (
      refreshStorage &&
      refreshToken &&
      refreshStorage.getItem("refresh_token") !== refreshToken
    ) {
      return null;
    }

    if (
      persistentSession &&
      localStorage.getItem("remember_me") !== "true"
    ) {
      return null;
    }

    const storage = persistentSession
      ? localStorage
      : sessionStorage;
    if (persistentSession) {
      for (const key of [
        "access_token",
        "refresh_token",
        "user",
        "isLoggedIn",
        "login_time",
      ]) {
        sessionStorage.removeItem(key);
      }
    }
    storage.setItem("isLoggedIn", "true");

    if (data.user) {
      storage.setItem("user", JSON.stringify(data.user));
    }

    storage.setItem("login_time", new Date().toISOString());
    storage.setItem("access_token", data.access_token);

    if (!persistentSession && data.refresh_token) {
      storage.setItem("refresh_token", data.refresh_token);
    } else if (refreshStorage === localStorage) {
      localStorage.removeItem("refresh_token");
    }

    window.dispatchEvent(new Event("auth-change"));

    return data;
  })().finally(() => {
    refreshRequest = null;
  });

  return refreshRequest;
}

function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    LOGOUT_EVENT_KEY,
    `${Date.now()}-${Math.random()}`
  );

  for (const storage of [sessionStorage, localStorage]) {
    storage.removeItem("access_token");
    storage.removeItem("refresh_token");
    storage.removeItem("user");
    storage.removeItem("isLoggedIn");
    storage.removeItem("login_time");
  }

  localStorage.removeItem("remember_me");

  window.dispatchEvent(
    new Event("auth-change")
  );
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  clearAuth();

  window.location.href = "/login";
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  let token =
    typeof window !== "undefined"
      ? getStoredValue("access_token")
      : null;

  async function makeRequest(
    accessToken: string | null
  ) {
    const headers = new Headers(
      options.headers || {}
    );

    const isFormData =
      typeof FormData !== "undefined" &&
      options.body instanceof FormData;

    if (isFormData) {
      headers.delete("Content-Type");
    } else if (
      options.body &&
      !headers.has("Content-Type")
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    if (accessToken) {
      headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );
    }

    const normalizedEndpoint =
      endpoint.startsWith("/")
        ? endpoint
        : `/${endpoint}`;

    const url =
      `${API_URL}${normalizedEndpoint}`;

    try {
      return await fetch(url, {
        ...options,
        headers,
        credentials: options.credentials ?? "include",
      });
    } catch (error) {
      console.error(
        "FETCH FAILED:",
        url,
        error
      );

      throw error;
    }
  }

  try {
    let response =
      await makeRequest(token);
    const authEndpointsWithoutRefresh = [
      "/auth/signup",
      "/auth/login",
      "/auth/verify-email",
      "/auth/send-verification-code",
      "/auth/google",
      "/auth/google/verify-otp",
      "/auth/refresh",
      "/auth/google/resend-otp",
      "/auth/reset-password",
      "/auth/forgot-password",
    ];

    const normalizedAuthEndpoint =
      endpoint.split("?")[0];

    const shouldTryRefresh =
      response.status === 401 &&
      !authEndpointsWithoutRefresh.includes(
        normalizedAuthEndpoint
      );

    if (shouldTryRefresh) {
      const refreshToken =
        typeof window !== "undefined"
          ? getStoredValue("refresh_token")
          : null;
      const persistentSession =
        typeof window !== "undefined" &&
        localStorage.getItem("remember_me") === "true";

      if (!refreshToken && !persistentSession) {
        redirectToLogin();

        return {
          success: false,
          status: 401,
          data: {
            detail:
              "Please login to continue.",
          },
        };
      }

      const refreshData = await refreshAuthSession();

      if (
        refreshData?.access_token &&
        (persistentSession || refreshData.refresh_token)
      ) {
        token =
          refreshData.access_token;

        response =
          await makeRequest(token);
      } else {
        redirectToLogin();

        return {
          success: false,
          status: 401,
          data: {
            detail:
              "Please login to continue.",
          },
        };
      }
    }

    const text =
      await response.text();

    let data: any = {};

    try {
      data = text
        ? JSON.parse(text)
        : {};
    } catch {
      data = {
        detail:
          text ||
          "Invalid server response.",
      };
    }

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error(
      "API FETCH ERROR:",
      error
    );

    return {
      success: false,
      status: 0,
      data: {
        detail:
          error instanceof Error
            ? error.message
            : "Unable to connect to the server.",
      },
    };
  }
}

export { API_URL };