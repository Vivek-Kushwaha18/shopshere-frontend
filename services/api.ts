const API_URL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000"
    : process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("login_time");

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
      ? sessionStorage.getItem("access_token")
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

    console.log(
      "API REQUEST:",
      url
    );

    try {
      return await fetch(url, {
        ...options,
        headers,
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
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/refresh",
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
          ? sessionStorage.getItem(
              "refresh_token"
            )
          : null;

      if (!refreshToken) {
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

      const refreshResponse =
        await fetch(
          `${API_URL}/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              refresh_token:
                refreshToken,
            }),
          }
        );

      const refreshText =
        await refreshResponse.text();

      let refreshData: any = {};

      try {
        refreshData = refreshText
          ? JSON.parse(refreshText)
          : {};
      } catch {
        refreshData = {};
      }

      if (
        refreshResponse.ok &&
        refreshData.access_token &&
        refreshData.refresh_token
      ) {
        token =
          refreshData.access_token;

        sessionStorage.setItem(
          "access_token",
          refreshData.access_token
        );

        sessionStorage.setItem(
          "refresh_token",
          refreshData.refresh_token
        );

        sessionStorage.setItem(
          "isLoggedIn",
          "true"
        );

        if (refreshData.user) {
          sessionStorage.setItem(
            "user",
            JSON.stringify(
              refreshData.user
            )
          );
        }

        window.dispatchEvent(
          new Event("auth-change")
        );

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

    console.log(
      "API RESPONSE:",
      response.status,
      data
    );

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