"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  BarChart3,
  Box,
  CircleDollarSign,
  FolderTree,
  Package,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";

import Swal from "sweetalert2";

import {
  getAdminReports,
  type AdminReports,
} from "@/services/reports";


export default function ReportsPage() {
  const [reports, setReports] =
    useState<AdminReports | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function loadReports() {
    try {
      setLoading(true);

      const data =
        await getAdminReports();

      setReports(data);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Unable to load reports",
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
    loadReports();
  }, []);


  if (loading) {
    return (
      <div className="p-6">
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-gray-500">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }


  if (!reports) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-gray-500">
            No report data available.
          </p>
        </div>
      </div>
    );
  }


  const summary =
    reports.summary;


  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Reports
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View your platform sales and order reports.
        </p>
      </div>


      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <ReportCard
          title="Total Sales"
          value={`₹${summary.total_sales.toLocaleString(
            "en-IN"
          )}`}
          icon={
            <CircleDollarSign className="h-5 w-5" />
          }
        />

        <ReportCard
          title="Total Orders"
          value={summary.total_orders}
          icon={
            <ShoppingCart className="h-5 w-5" />
          }
        />

        <ReportCard
          title="Paid Orders"
          value={summary.paid_orders}
          icon={
            <Package className="h-5 w-5" />
          }
        />

        <ReportCard
          title="Units Sold"
          value={summary.total_units_sold}
          icon={
            <Box className="h-5 w-5" />
          }
        />

        <ReportCard
          title="Customers"
          value={summary.total_customers}
          icon={
            <Users className="h-5 w-5" />
          }
        />

        <ReportCard
          title="Sellers"
          value={summary.total_sellers}
          icon={
            <Store className="h-5 w-5" />
          }
        />

        <ReportCard
          title="Products"
          value={summary.total_products}
          icon={
            <Package className="h-5 w-5" />
          }
        />

        <ReportCard
          title="Categories"
          value={summary.total_categories}
          icon={
            <FolderTree className="h-5 w-5" />
          }
        />

      </div>


      {/* ORDER STATUS */}

      <section className="rounded-xl border bg-white p-5">

        <div className="mb-5 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-700" />

          <h2 className="text-lg font-semibold text-gray-900">
            Orders by Status
          </h2>
        </div>


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <StatusCard
            title="Pending"
            value={
              reports.orders_by_status.pending
            }
          />

          <StatusCard
            title="Processing"
            value={
              reports.orders_by_status.processing
            }
          />

          <StatusCard
            title="Shipped"
            value={
              reports.orders_by_status.shipped
            }
          />

          <StatusCard
            title="Delivered"
            value={
              reports.orders_by_status.delivered
            }
          />

          <StatusCard
            title="Cancelled"
            value={
              reports.orders_by_status.cancelled
            }
          />

        </div>

      </section>


      {/* SALES BY DATE */}

      <section className="rounded-xl border bg-white p-5">

        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Sales by Date
        </h2>

        {reports.sales_by_date.length === 0 ? (
          <p className="text-sm text-gray-500">
            No sales data available.
          </p>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[600px] text-left text-sm">

              <thead>
                <tr className="border-b text-gray-500">
                  <th className="px-4 py-3 font-medium">
                    Date
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Orders
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Sales
                  </th>
                </tr>
              </thead>

              <tbody>

                {reports.sales_by_date.map(
                  (item) => (
                    <tr
                      key={item.date}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3 text-gray-900">
                        {item.date}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {item.orders}
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900">
                        ₹
                        {item.sales.toLocaleString(
                          "en-IN"
                        )}
                      </td>
                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>


      {/* TOP PRODUCTS */}

      <section className="rounded-xl border bg-white p-5">

        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Top Selling Products
        </h2>

        {reports.top_products.length === 0 ? (
          <p className="text-sm text-gray-500">
            No product sales data available.
          </p>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left text-sm">

              <thead>
                <tr className="border-b text-gray-500">

                  <th className="px-4 py-3 font-medium">
                    Product
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Units Sold
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Sales
                  </th>

                </tr>
              </thead>

              <tbody>

                {reports.top_products.map(
                  (product) => (
                    <tr
                      key={product.product_id}
                      className="border-b last:border-0"
                    >

                      <td className="px-4 py-3 font-medium text-gray-900">
                        {product.product_name}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {product.units_sold}
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900">
                        ₹
                        {product.sales.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}


/* =========================================================
   REPORT CARD
========================================================= */

function ReportCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-5">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-gray-100 p-3 text-gray-700">
          {icon}
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   STATUS CARD
========================================================= */

function StatusCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-gray-50 p-4">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold text-gray-900">
        {value}
      </p>

    </div>
  );
}