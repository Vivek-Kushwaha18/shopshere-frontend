"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  getSellerOrders,
  updateSellerOrderStatus,
  type Order,
} from "@/services/orders";

const STATUS_OPTIONS = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

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

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] =
    useState<number | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);

      const data = await getSellerOrders();

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

  async function handleStatusChange(
    orderId: number,
    newStatus: string
  ) {
    try {
      setUpdatingOrderId(orderId);

      const updatedOrder =
        await updateSellerOrderStatus(
          orderId,
          newStatus
        );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? updatedOrder
            : order
        )
      );

      Swal.fire({
        icon: "success",
        title: "Order updated",
        text: "Order status has been updated.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text:
          error instanceof Error
            ? error.message
            : "Unable to update order.",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">
          Orders
        </h1>

        <p className="mt-4 text-gray-500">
          Loading orders...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Orders
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage orders containing your products.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <h2 className="text-lg font-medium">
            No orders yet
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Orders containing your products will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const sellerOrderTotal = order.items.reduce(
              (total, item) => total + item.total,
              0
            );

            return (
              <div
                key={order.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                {/* ORDER HEADER */}

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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

                  {/* STATUS */}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {formatStatus(order.status)}
                    </span>

                    <select
                      value={order.status}
                      disabled={
                        updatingOrderId === order.id
                      }
                      onChange={(event) =>
                        handleStatusChange(
                          order.id,
                          event.target.value
                        )
                      }
                      className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="pending">
                        Pending
                      </option>

                      {STATUS_OPTIONS.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {formatStatus(status)}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* PRODUCTS */}

                <div className="mt-6">
                  <h3 className="mb-3 font-medium">
                    Your Products
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="px-3 py-3">
                            Product
                          </th>

                          <th className="px-3 py-3">
                            Quantity
                          </th>

                          <th className="px-3 py-3">
                            Price
                          </th>

                          <th className="px-3 py-3">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {order.items.map(
                          (item) => (
                            <tr
                              key={item.id}
                              className="border-b last:border-0"
                            >
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  {item.product_image ? (
                                    <img
                                      src={
                                        item.product_image
                                      }
                                      alt={
                                        item.product_name
                                      }
                                      className="h-14 w-14 rounded-md border object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">
                                      No image
                                    </div>
                                  )}

                                  <div>
                                    <p className="font-medium">
                                      {
                                        item.product_name
                                      }
                                    </p>

                                    <p className="text-xs text-gray-500">
                                      Product #
                                      {item.product_id}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-3 py-3">
                                {item.quantity}
                              </td>

                              <td className="px-3 py-3">
                                ₹
                                {item.price.toFixed(
                                  2
                                )}
                              </td>

                              <td className="px-3 py-3 font-medium">
                                ₹
                                {item.total.toFixed(
                                  2
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ORDER INFORMATION */}

                <div className="mt-6 grid gap-6 border-t pt-6 md:grid-cols-2">
                  {/* SHIPPING ADDRESS */}

                  <div>
                    <h3 className="text-sm font-medium">
                      Shipping Address
                    </h3>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                      {order.shipping_address}
                    </p>
                  </div>

                  {/* PAYMENT */}

                  <div>
                    <h3 className="text-sm font-medium">
                      Payment Status
                    </h3>

                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        order.payment_status ===
                        "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {formatStatus(
                        order.payment_status
                      )}
                    </span>
                  </div>
                </div>

                {/* SELLER TOTAL */}

                <div className="mt-6 flex items-center justify-between border-t pt-5">
                  <span className="text-lg font-semibold">
                    Your Order Total
                  </span>

                  <span className="text-2xl font-bold text-gray-900">
                    ₹
                    {sellerOrderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}