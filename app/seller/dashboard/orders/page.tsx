"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Swal from "sweetalert2";

import {
  createSellerShipment,
  getSellerOrders,
  getSellerShipments,
  updateSellerOrderStatus,
  updateShipmentStatus,
  updateShipmentTrackingNumber,
  type Order,
  type Shipment,
} from "@/services/orders";

const ORDER_STATUSES = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

function normalizeStatus(status?: string | null): string {
  return status?.trim().toLowerCase() ?? "";
}

function formatStatus(status?: string | null): string {
  if (!status) return "Unknown";

  return status
    .trim()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

function getStatusClass(status?: string | null): string {
  switch (normalizeStatus(status)) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";

    case "processing":
      return "bg-blue-100 text-blue-800";

    case "shipped":
      return "bg-purple-100 text-purple-800";

    case "out_for_delivery":
      return "bg-orange-100 text-orange-800";

    case "delivered":
    case "paid":
    case "refunded":
      return "bg-green-100 text-green-800";

    case "partially_refunded":
      return "bg-purple-100 text-purple-800";

    case "refund_pending":
    case "pending_refund":
    case "processing_refund":
      return "bg-orange-100 text-orange-800";

    case "refund_failed":
    case "failed":
    case "cancelled":
      return "bg-red-100 text-red-800";

    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatDate(value?: string | null): string {
  if (!value) return "Not recorded";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

function formatAddress(address: unknown): string[] {
  if (!address) {
    return ["No shipping address available."];
  }

  if (typeof address === "string") {
    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      return ["No shipping address available."];
    }

    try {
      const parsed: unknown = JSON.parse(trimmedAddress);

      if (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return formatAddress(parsed);
      }
    } catch {
      // The address is ordinary text, not JSON.
    }

    return trimmedAddress
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (typeof address === "object" && !Array.isArray(address)) {
    const data = address as Record<string, unknown>;

    const possibleFields = [
      "full_name",
      "name",
      "recipient_name",
      "phone",
      "phone_number",
      "address_line1",
      "address_line_1",
      "address_line2",
      "address_line_2",
      "street",
      "landmark",
      "city",
      "district",
      "state",
      "province",
      "postal_code",
      "pincode",
      "zip_code",
      "country",
    ];

    const lines = possibleFields
      .map((key) => data[key])
      .filter(
        (value): value is string | number =>
          (typeof value === "string" ||
            typeof value === "number") &&
          String(value).trim().length > 0
      )
      .map(String);

    if (lines.length > 0) {
      return [...new Set(lines)];
    }

    return [JSON.stringify(address, null, 2)];
  }

  return [String(address)];
}

function getTimelineMessage(
  timestamp?: string | null,
  fallback = "Status recorded"
): string {
  return timestamp ? formatDate(timestamp) : fallback;
}

function getItemTotal(item: Order["items"][number]): number {
  const total = Number(item.total);

  if (Number.isFinite(total)) {
    return total;
  }

  const price = Number(item.price);
  const quantity = Number(item.quantity);

  if (
    Number.isFinite(price) &&
    Number.isFinite(quantity)
  ) {
    return price * quantity;
  }

  return 0;
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [updatingOrderId, setUpdatingOrderId] =
    useState<number | null>(null);

  const [savingTrackingId, setSavingTrackingId] =
    useState<number | null>(null);

  const [creatingShipmentOrderId, setCreatingShipmentOrderId] =
    useState<number | null>(null);

  const [trackingNumbers, setTrackingNumbers] =
    useState<Record<number, string>>({});

  const [editingTrackingIds, setEditingTrackingIds] =
    useState<number[]>([]);

  // Refs keep polling stable while the user edits tracking numbers.
  const editingTrackingIdsRef = useRef<Set<number>>(new Set());
  const loadInProgressRef = useRef(false);
  const mountedRef = useRef(false);

  const loadOrders = useCallback(
    async (showLoading = false, showError = true) => {
      if (loadInProgressRef.current) {
        return;
      }

      loadInProgressRef.current = true;

      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const [ordersData, shipmentsData] = await Promise.all([
          getSellerOrders(),
          getSellerShipments(),
        ]);

        if (!mountedRef.current) return;

        setOrders(ordersData);
        setShipments(shipmentsData);

        setTrackingNumbers((previous) => {
          const next: Record<number, string> = {};

          for (const shipment of shipmentsData) {
            const isEditing =
              editingTrackingIdsRef.current.has(shipment.id);

            next[shipment.id] = isEditing
              ? previous[shipment.id] ??
                shipment.tracking_number ??
                ""
              : shipment.tracking_number ?? "";
          }

          return next;
        });
      } catch (error) {
        if (showError && mountedRef.current) {
          await Swal.fire({
            icon: "error",
            title: "Unable to load orders",
            text:
              error instanceof Error
                ? error.message
                : "Please try again.",
          });
        }
      } finally {
        loadInProgressRef.current = false;

        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;

    void loadOrders(true);

    const interval = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !loadInProgressRef.current
      ) {
        void loadOrders(false, false);
      }
    }, 15000);

    const refreshWhenVisible = () => {
      if (
        document.visibilityState === "visible" &&
        !loadInProgressRef.current
      ) {
        void loadOrders(false, false);
      }
    };

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      mountedRef.current = false;

      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [loadOrders]);

  // CREATE DELIVERY SHIPMENT

  async function handleCreateShipment(order: Order) {
    if (
      creatingShipmentOrderId !== null ||
      updatingOrderId !== null ||
      savingTrackingId !== null
    ) {
      return;
    }

    if (normalizeStatus(order.status) === "cancelled") {
      await Swal.fire({
        icon: "warning",
        title: "Order cancelled",
        text:
          "A delivery shipment cannot be created for a cancelled order.",
      });

      return;
    }

    const existingShipment = shipments.find(
      (shipment) =>
        String(shipment.order_id) === String(order.id)
    );

    if (existingShipment) {
      await Swal.fire({
        icon: "info",
        title: "Shipment already exists",
        text:
          `Shipment #${existingShipment.id} already exists ` +
          `for this order.`,
      });

      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Create delivery shipment?",
      text: `Create a delivery shipment for Order #${order.id}?`,
      showCancelButton: true,
      confirmButtonText: "Create Shipment",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setCreatingShipmentOrderId(order.id);

      await createSellerShipment(order.id);

      await loadOrders(false, false);

      await Swal.fire({
        icon: "success",
        title: "Shipment created",
        text: `A shipment was created for Order #${order.id}.`,
        confirmButtonText: "OK",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Unable to create shipment",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });

      await loadOrders(false, false);
    } finally {
      setCreatingShipmentOrderId(null);
    }
  }

  // UPDATE ORDER AND SHIPMENT STATUS

  async function handleOrderStatusChange(
    orderId: number,
    newStatus: string
  ) {
    if (
      !ORDER_STATUSES.includes(
        newStatus as (typeof ORDER_STATUSES)[number]
      ) ||
      updatingOrderId !== null ||
      savingTrackingId !== null ||
      creatingShipmentOrderId !== null
    ) {
      return;
    }

    const order = orders.find(
      (item) => String(item.id) === String(orderId)
    );

    if (!order) return;

    const currentOrderStatus = normalizeStatus(order.status);
    const normalizedNewStatus = normalizeStatus(newStatus);

    if (currentOrderStatus === normalizedNewStatus) {
      return;
    }

    if (currentOrderStatus === "cancelled") {
      await Swal.fire({
        icon: "warning",
        title: "Order cancelled",
        text:
          "A cancelled order cannot be updated from this control.",
      });

      return;
    }

    if (currentOrderStatus === "delivered") {
      await Swal.fire({
        icon: "warning",
        title: "Order already delivered",
        text:
          "A delivered order cannot be changed from this control.",
      });

      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Update order status?",
      text:
        `Change Order #${orderId} from ` +
        `${formatStatus(order.status)} to ` +
        `${formatStatus(newStatus)}?`,
      showCancelButton: true,
      confirmButtonText: "Update Status",
      cancelButtonText: "Keep Current Status",
      confirmButtonColor: "#2563eb",
    });

    if (!confirmation.isConfirmed) return;

    const needsShipment =
      normalizedNewStatus === "shipped" ||
      normalizedNewStatus === "delivered";

    const targetShipmentStatus =
      normalizedNewStatus === "shipped"
        ? "shipped"
        : normalizedNewStatus === "delivered"
          ? "delivered"
          : "processing";

    try {
      setUpdatingOrderId(orderId);

      let shipmentsToUpdate = shipments.filter(
        (shipment) =>
          String(shipment.order_id) === String(orderId)
      );

      // Create the shipment first if delivery requires one.
      if (needsShipment && shipmentsToUpdate.length === 0) {
        const newShipment = await createSellerShipment(orderId);

        shipmentsToUpdate = [newShipment];

        setShipments((current) => {
          if (
            current.some(
              (shipment) => shipment.id === newShipment.id
            )
          ) {
            return current;
          }

          return [...current, newShipment];
        });

        setTrackingNumbers((current) => ({
          ...current,
          [newShipment.id]: newShipment.tracking_number ?? "",
        }));
      }

      // Update the order.
      await updateSellerOrderStatus(orderId, normalizedNewStatus);

      // Do not assume the shipment API accepts "cancelled".
      // The UI will clearly indicate that the parent order is cancelled.
      if (normalizedNewStatus !== "cancelled") {
        for (const shipment of shipmentsToUpdate) {
          if (
            normalizeStatus(shipment.status) !==
            targetShipmentStatus
          ) {
            await updateShipmentStatus(
              shipment.id,
              targetShipmentStatus
            );
          }
        }
      }

      await loadOrders(false, false);

      await Swal.fire({
        icon: "success",
        title: "Status updated",
        text:
          normalizedNewStatus === "cancelled"
            ? `Order #${orderId} has been cancelled.`
            : `Order #${orderId} was updated to ${formatStatus(
                normalizedNewStatus
              )}.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Status update needs checking",
        text:
          (error instanceof Error
            ? error.message
            : "An API request failed.") +
          " Refreshing the data. If the order and shipment statuses disagree, check the backend records.",
        confirmButtonText: "OK",
      });

      await loadOrders(false, false);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // SAVE TRACKING NUMBER

  async function handleTrackingNumberSave(
    shipmentId: number,
    orderId: number
  ) {
    const order = orders.find(
      (item) => String(item.id) === String(orderId)
    );

    if (!order) return;

    if (normalizeStatus(order.status) === "cancelled") {
      await Swal.fire({
        icon: "warning",
        title: "Order cancelled",
        text:
          "Tracking information cannot be changed for a cancelled order.",
      });

      return;
    }

    const trackingNumber =
      trackingNumbers[shipmentId]?.trim() ?? "";

    if (!trackingNumber) {
      await Swal.fire({
        icon: "warning",
        title: "Tracking number required",
        text: "Enter a tracking number before saving.",
      });

      return;
    }

    if (
      savingTrackingId !== null ||
      updatingOrderId !== null ||
      creatingShipmentOrderId !== null
    ) {
      return;
    }

    try {
      setSavingTrackingId(shipmentId);

      await updateShipmentTrackingNumber(
        shipmentId,
        trackingNumber
      );

      editingTrackingIdsRef.current.delete(shipmentId);

      setEditingTrackingIds((current) =>
        current.filter((id) => id !== shipmentId)
      );

      setTrackingNumbers((current) => ({
        ...current,
        [shipmentId]: trackingNumber,
      }));

      await loadOrders(false, false);

      await Swal.fire({
        icon: "success",
        title: "Tracking number saved",
        text: "The shipment tracking number has been updated.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Unable to save tracking number",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setSavingTrackingId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="mt-4 text-gray-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <main className="min-w-0 p-4 sm:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage orders, shipments, and tracking numbers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders(false)}
          disabled={refreshing}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh orders"}
        </button>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <h2 className="text-lg font-medium">No orders yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Orders containing your products will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const orderShipments = shipments.filter(
              (shipment) =>
                String(shipment.order_id) === String(order.id)
            );

            const orderTotal = order.items.reduce(
              (sum, item) => sum + getItemTotal(item),
              0
            );

            const isCancelled =
              normalizeStatus(order.status) === "cancelled";

            const isDelivered =
              normalizeStatus(order.status) === "delivered";

            const isCreatingThisShipment =
              creatingShipmentOrderId === order.id;

            return (
              <article
                key={order.id}
                className="min-w-0 rounded-lg border bg-white p-4 shadow-sm sm:p-6"
              >
                {/* ORDER STATUS */}

                <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">
                      Order #{order.id}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2 md:items-end">
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                        order.status
                      )}`}
                    >
                      Order: {formatStatus(order.status)}
                    </span>

                    <label
                      htmlFor={`order-status-${order.id}`}
                      className="text-xs font-medium text-gray-600"
                    >
                      Update Order Status
                    </label>

                    <select
                      id={`order-status-${order.id}`}
                      value={order.status || "processing"}
                      disabled={
                        updatingOrderId !== null ||
                        savingTrackingId !== null ||
                        creatingShipmentOrderId !== null ||
                        isCancelled ||
                        isDelivered
                      }
                      onChange={(event) =>
                        void handleOrderStatusChange(
                          order.id,
                          event.target.value
                        )
                      }
                      className="w-full rounded-md border px-3 py-2 text-sm disabled:bg-gray-100 md:w-56"
                    >
                      {!ORDER_STATUSES.includes(
                        order.status as (typeof ORDER_STATUSES)[number]
                      ) && (
                        <option value={order.status}>
                          {formatStatus(order.status)}
                        </option>
                      )}

                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>

                    {updatingOrderId === order.id && (
                      <span className="text-xs text-gray-500">
                        Updating order and shipment...
                      </span>
                    )}

                    {isCancelled && (
                      <p className="text-xs text-red-600">
                        This order has been cancelled.
                      </p>
                    )}

                    {isDelivered && (
                      <p className="text-xs text-green-700">
                        This order has been delivered.
                      </p>
                    )}
                  </div>
                </div>

                {/* PRODUCTS */}

                <section className="mt-6 min-w-0">
                  <h3 className="mb-3 font-medium">Your Products</h3>

                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="px-3 py-3">Product</th>
                          <th className="px-3 py-3">Quantity</th>
                          <th className="px-3 py-3">Price</th>
                          <th className="px-3 py-3">Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {order.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b last:border-0"
                          >
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                {item.product_image ? (
                                  <img
                                    src={item.product_image}
                                    alt={item.product_name}
                                    className="h-14 w-14 shrink-0 rounded-md border object-cover"
                                  />
                                ) : (
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">
                                    No image
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="break-words font-medium [overflow-wrap:anywhere]">
                                    {item.product_name}
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    Product #{item.product_id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-3">
                              {item.quantity}
                            </td>

                            <td className="px-3 py-3">
                              ₹{Number(item.price).toFixed(2)}
                            </td>

                            <td className="px-3 py-3 font-medium">
                              ₹{getItemTotal(item).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* SHIPPING ADDRESS */}

                <details className="mt-6 min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-gray-50 px-4 py-4 hover:bg-gray-100 [&::-webkit-details-marker]:hidden">
                    <span className="font-medium text-gray-900">
                      Shipping Address
                    </span>

                    <span className="shrink-0 text-sm text-blue-600">
                      View address
                    </span>
                  </summary>

                  <div className="min-w-0 border-t border-gray-200 px-4 py-4">
                    <div className="flex min-w-0 flex-col items-start gap-2 text-sm leading-6 text-gray-700">
                      {formatAddress(order.shipping_address).map(
                        (line, index) => (
                          <p
                            key={`${index}-${line}`}
                            className="w-full break-words [overflow-wrap:anywhere]"
                          >
                            {line}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </details>

                {/* DELIVERY SHIPMENTS */}

                <section className="mt-6 min-w-0 border-t pt-6">
                  <h3 className="font-medium">Delivery Shipment</h3>

                  {isCancelled && orderShipments.length > 0 && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      This order is cancelled. The shipment record may
                      still contain its previous status. Confirm the
                      cancellation and any required courier action in
                      the backend.
                    </div>
                  )}

                  {orderShipments.length === 0 ? (
                    <div className="mt-3 rounded-lg border border-dashed p-4">
                      <p className="text-sm text-gray-600">
                        No delivery shipment has been created for this order.
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Create a shipment to add tracking information and
                        update delivery progress.
                      </p>

                      <button
                        type="button"
                        onClick={() => void handleCreateShipment(order)}
                        disabled={
                          isCancelled ||
                          isDelivered ||
                          creatingShipmentOrderId !== null ||
                          updatingOrderId !== null ||
                          savingTrackingId !== null
                        }
                        className="mt-4 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCreatingThisShipment
                          ? "Creating Shipment..."
                          : "Create Delivery Shipment"}
                      </button>

                      {isCancelled && (
                        <p className="mt-2 text-xs text-red-600">
                          Shipments cannot be created for cancelled orders.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-5">
                      {orderShipments.map((shipment) => {
                        const currentStatus =
                          normalizeStatus(shipment.status) ||
                          "processing";

                        // A cancelled order must not look as though
                        // delivery is progressing normally.
                        const shippedComplete =
                          !isCancelled &&
                          [
                            "shipped",
                            "out_for_delivery",
                            "delivered",
                          ].includes(currentStatus);

                        const outForDeliveryComplete =
                          !isCancelled &&
                          [
                            "out_for_delivery",
                            "delivered",
                          ].includes(currentStatus);

                        const deliveredComplete =
                          !isCancelled &&
                          currentStatus === "delivered";

                        return (
                          <div
                            key={shipment.id}
                            className="min-w-0 rounded-lg border p-4"
                          >
                            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-medium">
                                  Shipment #{shipment.id}
                                </p>

                                <span
                                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                                    shipment.status
                                  )}`}
                                >
                                  {formatStatus(shipment.status)}
                                </span>
                              </div>

                              <p className="text-sm text-gray-500">
                                {isCancelled
                                  ? "The parent order is cancelled."
                                  : "Shipment status is maintained by the delivery workflow."}
                              </p>
                            </div>

                            {/* TRACKING NUMBER */}

                            <div className="mt-5 min-w-0 rounded-lg border bg-white p-4">
                              <h4 className="font-medium text-gray-900">
                                Tracking Number
                              </h4>

                              <p className="mt-2 break-words text-sm text-gray-700 [overflow-wrap:anywhere]">
                                {shipment.tracking_number?.trim()
                                  ? shipment.tracking_number
                                  : "No tracking number added."}
                              </p>

                              <label
                                htmlFor={`tracking-${shipment.id}`}
                                className="mt-4 block text-sm font-medium text-gray-700"
                              >
                                Enter or update tracking number
                              </label>

                              <div className="mt-2 flex min-w-0 flex-col gap-3 sm:flex-row">
                                <input
                                  id={`tracking-${shipment.id}`}
                                  type="text"
                                  value={trackingNumbers[shipment.id] ?? ""}
                                  onFocus={() => {
                                    editingTrackingIdsRef.current.add(
                                      shipment.id
                                    );

                                    setEditingTrackingIds((current) =>
                                      current.includes(shipment.id)
                                        ? current
                                        : [...current, shipment.id]
                                    );
                                  }}
                                  onChange={(event) =>
                                    setTrackingNumbers((current) => ({
                                      ...current,
                                      [shipment.id]: event.target.value,
                                    }))
                                  }
                                  disabled={
                                    isCancelled ||
                                    isDelivered ||
                                    savingTrackingId !== null ||
                                    updatingOrderId !== null ||
                                    creatingShipmentOrderId !== null
                                  }
                                  placeholder="Enter courier tracking number"
                                  className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleTrackingNumberSave(
                                      shipment.id,
                                      order.id
                                    )
                                  }
                                  disabled={
                                    isCancelled ||
                                    isDelivered ||
                                    savingTrackingId !== null ||
                                    updatingOrderId !== null ||
                                    creatingShipmentOrderId !== null
                                  }
                                  className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {savingTrackingId === shipment.id
                                    ? "Saving..."
                                    : "Save"}
                                </button>
                              </div>
                            </div>

                            {/* DELIVERY TIMELINE */}

                            <details className="mt-5 min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-gray-50 px-4 py-4 hover:bg-gray-100 [&::-webkit-details-marker]:hidden">
                                <span className="font-medium text-gray-900">
                                  Delivery Timeline
                                </span>

                                <span className="shrink-0 text-sm text-blue-600">
                                  View timeline
                                </span>
                              </summary>

                              <div className="border-t border-gray-200 px-4 py-4">
                                {isCancelled && (
                                  <p className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-700">
                                    Delivery progress is not shown as active
                                    because this order is cancelled.
                                  </p>
                                )}

                                <div className="space-y-5">
                                  {/* PROCESSING */}

                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                                        !isCancelled
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    />

                                    <div className="min-w-0 text-sm">
                                      <p className="font-medium text-gray-900">
                                        Processing
                                      </p>

                                      <p className="break-words text-gray-600">
                                        {getTimelineMessage(
                                          shipment.created_at,
                                          "Shipment created"
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* SHIPPED */}

                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                                        shippedComplete
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    />

                                    <div className="min-w-0 text-sm">
                                      <p className="font-medium text-gray-900">
                                        Shipped
                                      </p>

                                      <p className="break-words text-gray-600">
                                        {isCancelled
                                          ? "Order cancelled"
                                          : shippedComplete
                                            ? getTimelineMessage(
                                                shipment.shipped_at,
                                                "Shipment marked as shipped"
                                              )
                                            : "Waiting for shipment"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* OUT FOR DELIVERY */}

                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                                        outForDeliveryComplete
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    />

                                    <div className="min-w-0 text-sm">
                                      <p className="font-medium text-gray-900">
                                        Out for delivery
                                      </p>

                                      <p className="break-words text-gray-600">
                                        {isCancelled
                                          ? "Order cancelled"
                                          : outForDeliveryComplete
                                            ? getTimelineMessage(
                                                shipment.out_for_delivery_at,
                                                "Shipment marked out for delivery"
                                              )
                                            : "Waiting for courier delivery"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* DELIVERED */}

                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                                        deliveredComplete
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    />

                                    <div className="min-w-0 text-sm">
                                      <p className="font-medium text-gray-900">
                                        Delivered
                                      </p>

                                      <p className="break-words text-gray-600">
                                        {isCancelled
                                          ? "Order cancelled"
                                          : deliveredComplete
                                            ? getTimelineMessage(
                                                shipment.delivered_at,
                                                "Shipment marked as delivered"
                                              )
                                            : "Not delivered yet"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* EXPECTED DELIVERY */}

                                  {shipment.expected_delivery_date &&
                                    !isCancelled && (
                                      <div className="border-t pt-3 text-sm">
                                        <p className="font-medium text-gray-900">
                                          Expected delivery
                                        </p>

                                        <p className="mt-1 break-words text-gray-600">
                                          {formatDate(
                                            shipment.expected_delivery_date
                                          )}
                                        </p>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </details>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* PAYMENT STATUS AND SELLER SUBTOTAL */}

                <section className="mt-6 flex min-w-0 flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      Payment Status
                    </h3>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                        order.payment_status
                      )}`}
                    >
                      {formatStatus(order.payment_status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div>
                      <p className="text-base font-semibold">
                        Your Items Subtotal
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Based on the items shown for this seller.
                      </p>
                    </div>

                    <span className="text-xl font-bold text-gray-900">
                      ₹{orderTotal.toFixed(2)}
                    </span>
                  </div>
                </section>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}