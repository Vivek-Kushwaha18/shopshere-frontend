"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
} from "lucide-react";
import Swal from "sweetalert2";

import {
  getOrder,
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
  if (!status) {
    return "";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadOrder() {
    try {
      setLoading(true);

      const orderId = Number(params.id);

      if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new Error("Invalid order ID.");
      }

      const data = await getOrder(orderId);

      setOrder(data);
    } catch (error) {
      console.error("Failed to load order:", error);

      await Swal.fire({
        icon: "error",
        title: "Unable to load order",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });

      router.push("/orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>

          <div className="mt-8 rounded-lg border bg-white p-10 text-center">
            <p className="text-gray-500">
              Loading order details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">

        {/* BACK */}

        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        {/* HEADER */}

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Order #{order.id}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Placed on{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                  order.status
                )}`}
              >
                {formatStatus(order.status)}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  order.payment_status === "paid"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                Payment:{" "}
                {formatStatus(order.payment_status)}
              </span>
            </div>
          </div>
        </div>

        {/* ORDER STATUS */}

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Order Status
              </h2>

              <p className="text-sm text-gray-500">
                Current status of your order
              </p>
            </div>
          </div>

          <div className="mt-5">
            <span
              className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusClass(
                order.status
              )}`}
            >
              {formatStatus(order.status)}
            </span>
          </div>
        </div>

        {/* PRODUCTS */}

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-700" />

            <h2 className="text-xl font-semibold">
              Products
            </h2>
          </div>

          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
              >
                {item.product_image ? (
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="h-24 w-24 shrink-0 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">
                    No image
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900">
                    {item.product_name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Product #{item.product_id}
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm text-gray-500">
                    ₹{item.price.toFixed(2)} × {item.quantity}
                  </p>

                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    ₹{item.total.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DELIVERY + PAYMENT */}

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          {/* DELIVERY */}

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-700" />

              <h2 className="text-lg font-semibold">
                Delivery Address
              </h2>
            </div>

            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-600">
              {order.shipping_address}
            </p>
          </div>

          {/* PAYMENT */}

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gray-700" />

              <h2 className="text-lg font-semibold">
                Payment
              </h2>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Payment Status
              </p>

              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  order.payment_status === "paid"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {formatStatus(order.payment_status)}
              </span>

              <p className="mt-3 text-sm text-gray-500">
                Payment is currently not required.
              </p>
            </div>
          </div>
        </div>

        {/* TOTAL */}

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              Order Total
            </span>

            <span className="text-2xl font-bold text-gray-900">
              ₹{order.total_amount.toFixed(2)}
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}