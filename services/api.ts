const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("isLoggedIn");

  window.dispatchEvent(
    new Event("auth-change")
  );
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  let token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  async function makeRequest(
    accessToken: string | null
  ) {
    const headers = new Headers(
      options.headers || {}
    );

    /*
     * Check whether the request body is FormData.
     */
    const isFormData =
      typeof FormData !== "undefined" &&
      options.body instanceof FormData;

    /*
     * IMPORTANT:
     *
     * FormData must NOT have:
     * Content-Type: application/json
     *
     * The browser automatically creates:
     * multipart/form-data; boundary=...
     */
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

    /*
     * Add access token.
     */
    if (accessToken) {
      headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );
    }

    /*
     * Make sure endpoint starts with /
     */
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
    // ==========================================================
    // FIRST REQUEST
    // ==========================================================

    let response =
      await makeRequest(token);

    // ==========================================================
    // ENDPOINTS THAT SHOULD NOT AUTO-REFRESH
    // ==========================================================

    const authEndpointsWithoutRefresh = [
      "/auth/signup",
      "/auth/login",
      "/auth/verify-email",
      "/auth/send-verification-code",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/refresh",
    ];

    const shouldTryRefresh =
      response.status === 401 &&
      !authEndpointsWithoutRefresh.includes(
        endpoint
      );

    // ==========================================================
    // ACCESS TOKEN EXPIRED
    // ==========================================================

    if (shouldTryRefresh) {
      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem(
              "refresh_token"
            )
          : null;

      // ========================================================
      // NO REFRESH TOKEN
      // ========================================================

      if (!refreshToken) {
        clearAuth();

        return {
          success: false,
          status: 401,
          data: {
            detail:
              "Session expired. Please login again.",
          },
        };
      }

      // ========================================================
      // REFRESH TOKEN REQUEST
      // ========================================================

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

      // ========================================================
      // REFRESH SUCCESSFUL
      // ========================================================

      if (
        refreshResponse.ok &&
        refreshData.access_token &&
        refreshData.refresh_token
      ) {
        token =
          refreshData.access_token;

        localStorage.setItem(
          "access_token",
          refreshData.access_token
        );

        localStorage.setItem(
          "refresh_token",
          refreshData.refresh_token
        );

        localStorage.setItem(
          "isLoggedIn",
          "true"
        );

        if (refreshData.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(
              refreshData.user
            )
          );
        }

        window.dispatchEvent(
          new Event("auth-change")
        );

        // ======================================================
        // RETRY ORIGINAL REQUEST
        // ======================================================

        response =
          await makeRequest(token);
      } else {
        // ========================================================
        // REFRESH FAILED
        // ========================================================

        clearAuth();

        return {
          success: false,
          status: 401,
          data: {
            detail:
              "Session expired. Please login again.",
          },
        };
      }
    }

    // ==========================================================
    // READ RESPONSE
    // ==========================================================

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