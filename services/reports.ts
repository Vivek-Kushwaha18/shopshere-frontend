import { apiFetch } from "./api";

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
  const response = await apiFetch(
    "/admin/reports/"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch admin reports."
    );
  }

  const reports = response.data?.data;

  if (!reports) {
    throw new Error(
      "Invalid reports response."
    );
  }

  return reports;
}