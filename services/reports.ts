
import {
  apiFetch,
  API_URL,
  refreshAuthSession,
} from "./api";

export interface ReportSummary {
  total_sales: number;
  total_orders: number;
  paid_orders: number;
  total_units_sold: number;
  total_customers: number;
  total_sellers: number;
  total_products: number;
  total_categories: number;
}

export interface OrdersByStatus {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface SalesByDate {
  date: string;
  orders: number;
  sales: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  units_sold: number;
  sales: number;
}

export interface AdminReports {
  summary: ReportSummary;
  orders_by_status: OrdersByStatus;
  sales_by_date: SalesByDate[];
  top_products: TopProduct[];
}

export async function getAdminReports(): Promise<AdminReports> {
  const response = await apiFetch("/admin/reports/");

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch admin reports."
    );
  }

  const reports = response.data?.data;

  if (!reports) {
    throw new Error("Invalid reports response.");
  }

  return reports;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("access_token")
  );
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data = await response.json();

    return (
      data?.detail ||
      data?.message ||
      "Unable to download reports."
    );
  } catch {
    return "Unable to download reports.";
  }
}

export async function downloadAdminReportsZip(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error(
      "Report downloads are only available in the browser."
    );
  }

  async function requestDownload(
    token: string | null
  ): Promise<Response> {
    return fetch(`${API_URL}/admin/reports/export`, {
      method: "GET",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      credentials: "include",
      cache: "no-store",
    });
  }

  let response = await requestDownload(getAccessToken());

  if (response.status === 401) {
    const refreshed = await refreshAuthSession();

    if (!refreshed?.access_token) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    response = await requestDownload(
      refreshed.access_token
    );
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("application/zip")) {
    throw new Error(
      "The server did not return a ZIP file. Check that the backend export endpoint is deployed."
    );
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error("The downloaded ZIP file is empty.");
  }

  const disposition =
    response.headers.get("content-disposition") || "";

  const filenameMatch =
    disposition.match(/filename="?([^";]+)"?/i);

  const filename =
    filenameMatch?.[1] ||
    `shopsphere_admin_reports_${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z")}.zip`;

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}
