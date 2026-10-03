"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

import {
  getMyOrders,
  type Order,
} from "@/services/orders";


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


function formatStatus(status: string) {
  return status
    .charAt(0)
    .toUpperCase() + status.slice(1);
}


export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);


  async function loadOrders() {
    try {
      setLoading(true);

      const data = await getMyOrders();

      setOrders(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load orders",
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
    loadOrders();
  }, []);


  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold">
            My Orders
          </h1>

          <p className="mt-4 text-gray-500">
            Loading your orders...
          </p>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-semibold">
            My Orders
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            View your orders and track their status.
          </p>
        </div>


        {/* NO ORDERS */}

        {orders.length === 0 ? (
          <div className="rounded-lg border bg-white p-10 text-center">

            <h2 className="text-xl font-medium">
              No orders yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your orders will appear here after you place an order.
            </p>

          </div>
        ) : (
          <div className="space-y-6">

            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >

                {/* ORDER HEADER */}

                <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-start md:justify-between">

                  <div>
                    <h2 className="text-lg font-semibold">
                      Order #{order.id}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Placed on{" "}
                      {new Date(
                        order.created_at
                      ).toLocaleString()}
                    </p>
                  </div>


                  <div className="flex flex-wrap gap-2">

                    {/* ORDER STATUS */}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {formatStatus(order.status)}
                    </span>


                    {/* PAYMENT STATUS */}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        order.payment_status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      Payment:{" "}
                      {formatStatus(
                        order.payment_status
                      )}
                    </span>

                  </div>

                </div>


                {/* PRODUCTS */}

                <div className="py-6">

                  <h3 className="mb-4 text-base font-medium">
                    Products
                  </h3>


                  <div className="space-y-4">

                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                      >

                        {/* IMAGE */}

                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-20 w-20 shrink-0 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">
                            No image
                          </div>
                        )}


                        {/* PRODUCT INFO */}

                        <div className="min-w-0 flex-1">

                          <h4 className="font-medium">
                            {item.product_name}
                          </h4>

                          <p className="mt-1 text-xs text-gray-500">
                            Product #{item.product_id}
                          </p>

                          <p className="mt-2 text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>

                        </div>


                        {/* PRICE */}

                        <div className="sm:text-right">

                          <p className="text-sm text-gray-500">
                            ₹
                            {item.price.toFixed(2)}
                            {" "}×{" "}
                            {item.quantity}
                          </p>

                          <p className="mt-1 font-semibold">
                            ₹
                            {item.total.toFixed(2)}
                          </p>

                        </div>

                      </div>
                    ))}

                  </div>

                </div>


                {/* ORDER DETAILS */}

                <div className="grid gap-6 border-t pt-6 md:grid-cols-2">

                  {/* SHIPPING ADDRESS */}

                  <div>

                    <h3 className="text-sm font-medium">
                      Shipping Address
                    </h3>

                    <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                      {order.shipping_address}
                    </p>

                  </div>


                  {/* ORDER TOTAL */}

                  <div className="md:text-right">

                    <p className="text-sm text-gray-500">
                      Order Total
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      ₹
                      {order.total_amount.toFixed(2)}
                    </p>

                  </div>

                </div>


                {/* VIEW DETAILS */}

                <div className="mt-6 border-t pt-5">

                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    View Order Details
                  </Link>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}