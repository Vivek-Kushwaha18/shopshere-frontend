const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

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

    headers.set(
      "Content-Type",
      "application/json"
    );

    if (accessToken) {
      headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );
    }

    return fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );
  }

  try {
    // ==========================================================
    // FIRST REQUEST
    // ==========================================================

    let response = await makeRequest(token);

    // ==========================================================
    // ACCESS TOKEN EXPIRED
    // ==========================================================

    if (
      response.status === 401 &&
      endpoint !== "/auth/refresh"
    ) {
      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("refresh_token")
          : null;

      // ========================================================
      // NO REFRESH TOKEN
      // ========================================================

      if (!refreshToken) {
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        localStorage.removeItem(
          "isLoggedIn"
        );

        localStorage.removeItem(
          "verification_email"
        );

        window.dispatchEvent(
          new Event("auth-change")
        );

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
      // REFRESH ACCESS TOKEN
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

        window.dispatchEvent(
          new Event("auth-change")
        );

        // ======================================================
        // RETRY ORIGINAL REQUEST
        // ======================================================

        response = await makeRequest(
          token
        );
      } else {
        // ======================================================
        // REFRESH FAILED
        // ======================================================

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        localStorage.removeItem(
          "isLoggedIn"
        );

        localStorage.removeItem(
          "verification_email"
        );

        window.dispatchEvent(
          new Event("auth-change")
        );

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

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error(
      "API request failed:",
      error
    );

    return {
      success: false,
      status: 0,
      data: {
        detail:
          "Unable to connect to the server.",
      },
    };
  }
}