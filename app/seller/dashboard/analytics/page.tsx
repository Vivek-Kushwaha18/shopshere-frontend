"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  getSellerAnalytics,
  type SellerAnalytics,
} from "@/services/orders";

function formatStatus(status: string) {
  if (!status) return "";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";

    case "processing":
      return "bg-blue-100 text-blue-800";

    case "shipped":
      return "bg-purple-100 text-purple-800";

    case "delivered":
      return "bg-green-100 text-green-800";

    case "cancelled":
      return "bg-red-100 text-red-800";

    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function SellerAnalyticsPage() {
  const [analytics, setAnalytics] =
    useState<SellerAnalytics | null>(null);

  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    try {
      setLoading(true);

      const data = await getSellerAnalytics();

      setAnalytics(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load analytics",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">
          Sales Analytics
        </h1>

        <p className="mt-4 text-gray-500">
          Loading analytics...
        </p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">
          Sales Analytics
        </h1>

        <p className="mt-4 text-gray-500">
          Analytics data is not available.
        </p>
      </div>
    );
  }

  const statuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  return (
    <div className="p-6">
      {/* PAGE HEADER */}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Sales Analytics
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Overview of your product sales and orders.
        </p>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Orders
          </p>

          <p className="mt-2 text-3xl font-bold">
            {analytics.total_orders}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Units Sold
          </p>

          <p className="mt-2 text-3xl font-bold">
            {analytics.total_units}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Sales
          </p>

          <p className="mt-2 text-3xl font-bold">
            ₹{analytics.total_sales.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ORDER STATUS */}

      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Orders by Status
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statuses.map((status) => (
            <div
              key={status}
              className="rounded-lg border p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                    status
                  )}`}
                >
                  {formatStatus(status)}
                </span>

                <span className="text-2xl font-bold">
                  {
                    analytics.orders_by_status[
                      status as keyof typeof analytics.orders_by_status
                    ]
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP PRODUCTS */}

      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Top Products
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Your top 5 products by units sold.
          </p>
        </div>

        {analytics.top_products.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-gray-500">
              No product sales yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-3">
                    Product
                  </th>

                  <th className="px-3 py-3">
                    Product ID
                  </th>

                  <th className="px-3 py-3">
                    Units Sold
                  </th>

                  <th className="px-3 py-3">
                    Sales
                  </th>
                </tr>
              </thead>

              <tbody>
                {analytics.top_products.map(
                  (product) => (
                    <tr
                      key={product.product_id}
                      className="border-b last:border-0"
                    >
                      <td className="px-3 py-4 font-medium">
                        {product.product_name}
                      </td>

                      <td className="px-3 py-4 text-gray-500">
                        #{product.product_id}
                      </td>

                      <td className="px-3 py-4">
                        {product.units_sold}
                      </td>

                      <td className="px-3 py-4 font-medium">
                        ₹{product.sales.toFixed(2)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}