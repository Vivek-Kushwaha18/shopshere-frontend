"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  getSellerAnalytics,
  type SellerAnalytics,
} from "@/services/orders";

export default function SellerRevenuePage() {
  const [analytics, setAnalytics] =
    useState<SellerAnalytics | null>(null);

  const [loading, setLoading] = useState(true);

  async function loadRevenue() {
    try {
      setLoading(true);

      const data = await getSellerAnalytics();

      setAnalytics(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load revenue",
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
    loadRevenue();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">
          Revenue
        </h1>

        <p className="mt-4 text-gray-500">
          Loading revenue...
        </p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">
          Revenue
        </h1>

        <p className="mt-4 text-gray-500">
          Revenue data is not available.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* HEADER */}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Revenue
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Overview of sales generated from your products.
        </p>
      </div>

      {/* REVENUE SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Sales
          </p>

          <p className="mt-2 text-3xl font-bold">
            ₹{analytics.total_sales.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Orders
          </p>

          <p className="mt-2 text-3xl font-bold">
            {analytics.total_orders}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Units Sold
          </p>

          <p className="mt-2 text-3xl font-bold">
            {analytics.total_units}
          </p>
        </div>
      </div>

      {/* SALES INFORMATION */}

      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Sales Summary
        </h2>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-sm text-gray-500">
              Total Sales
            </span>

            <span className="font-semibold">
              ₹{analytics.total_sales.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-sm text-gray-500">
              Total Orders
            </span>

            <span className="font-semibold">
              {analytics.total_orders}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Units Sold
            </span>

            <span className="font-semibold">
              {analytics.total_units}
            </span>
          </div>
        </div>
      </div>

      {/* NOTE */}

      <div className="mt-6 rounded-lg border bg-gray-50 p-5">
        <p className="text-sm text-gray-600">
          Revenue shown here is based on your product sales.
          Payment processing is currently disabled, so this
          should not be treated as confirmed paid revenue.
        </p>
      </div>
    </div>
  );
}