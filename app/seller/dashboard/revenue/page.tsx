
"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  downloadSellerRevenueZip,
  getSellerAnalytics,
  type SellerAnalytics,
} from "@/services/orders";

export default function SellerRevenuePage() {
  const [analytics, setAnalytics] =
    useState<SellerAnalytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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

  async function handleDownloadRevenue() {
    if (downloading) {
      return;
    }

    try {
      setDownloading(true);

      await downloadSellerRevenueZip();

      await Swal.fire({
        icon: "success",
        title: "Download started",
        text: "Your seller revenue ZIP has been downloaded.",
        confirmButtonColor: "#4F46E5",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Download failed",
        text:
          error instanceof Error
            ? error.message
            : "Unable to download your revenue report.",
        confirmButtonColor: "#4F46E5",
      });
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    void loadRevenue();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Revenue
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Overview of sales generated from your products.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadRevenue}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Preparing ZIP...
              </>
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v12m0 0 4-4m-4 4-4-4M5 16v4h14v-4"
                  />
                </svg>
                Download Revenue ZIP
              </>
            )}
          </button>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Revenue data is not available. You can retry loading the
            summary or download your report if the export endpoint is
            available.
          </p>

          <button
            type="button"
            onClick={() => void loadRevenue()}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Revenue
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Overview of sales generated from your products.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadRevenue}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Preparing ZIP...
            </>
          ) : (
            <>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v12m0 0 4-4m-4 4-4-4M5 16v4h14v-4"
                />
              </svg>
              Download Revenue 
            </>
          )}
        </button>
      </div>

      {/* REVENUE SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Sales
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            ₹{analytics.total_sales.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Orders
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {analytics.total_orders}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Units Sold
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {analytics.total_units}
          </p>
        </div>
      </div>

      {/* SALES INFORMATION */}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Sales Summary
        </h2>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <span className="text-sm text-gray-500">
              Total Sales
            </span>

            <span className="font-semibold text-gray-900">
              ₹{analytics.total_sales.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <span className="text-sm text-gray-500">
              Total Orders
            </span>

            <span className="font-semibold text-gray-900">
              {analytics.total_orders}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Units Sold
            </span>

            <span className="font-semibold text-gray-900">
              {analytics.total_units}
            </span>
          </div>
        </div>
      </div>

      {/* PAYMENT INFORMATION */}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm leading-6 text-gray-600">
          Revenue shown here is based on your product sales.
          Payment processing is currently disabled, so this
          should not be treated as confirmed paid revenue.
        </p>
      </div>
    </div>
  );
}
