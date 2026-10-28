"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  HelpCircle,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import {
  getMyOrders,
  getCustomerOrderShipments,
  cancelOrder,
  type Order,
  type Shipment,
} from "@/services/orders";

type OrderFilter = "all" | "open" | "delivered" | "cancelled";

function normalizeStatus(status?: string | null): string {
  return (status || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
}

function formatStatus(status?: string | null): string {
  if (!status) return "Unknown";

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCurrency(amount: number): string {
  const value = Number(amount);

  return `₹${(Number.isFinite(value) ? value : 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(date?: string | null): string {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusColor(status: string) {
  switch (normalizeStatus(status)) {
    case "delivered":
      return "text-[#00875A]";
    case "cancelled":
      return "text-[#C62828]";
    case "shipped":
    case "out_for_delivery":
      return "text-[#2874F0]";
    case "pending":
      return "text-[#B7791F]";
    case "processing":
      return "text-[#2874F0]";
    default:
      return "text-gray-600";
  }
}

function getPaymentStatusClass(status: string) {
  switch (normalizeStatus(status)) {
    case "paid":
      return "bg-green-50 text-green-700";

    case "refunded":
    case "partially_refunded":
      return "bg-purple-50 text-purple-700";

    case "refund_pending":
    case "pending_refund":
    case "processing_refund":
    case "pending":
    case "processing":
      return "bg-amber-50 text-amber-700";

    case "refund_failed":
    case "failed":
    case "cancelled":
    case "unpaid":
    case "not_paid":
      return "bg-red-50 text-red-700";

    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getStatusIcon(status: string) {
  switch (normalizeStatus(status)) {
    case "delivered":
      return CheckCircle2;

    case "cancelled":
      return XCircle;

    case "shipped":
    case "out_for_delivery":
      return Truck;

    default:
      return Clock3;
  }
}

function getShipmentProgress(status: string) {
  switch (normalizeStatus(status)) {
    case "processing":
    case "pending":
      return 1;

    case "shipped":
      return 2;

    case "out_for_delivery":
      return 3;

    case "delivered":
      return 4;

    default:
      return 0;
  }
}

function ShipmentTimeline({ shipment }: { shipment: Shipment }) {
  const progress = getShipmentProgress(shipment.status);

  const steps = [
    { key: "ordered", label: "Ordered", date: shipment.created_at },
    { key: "shipped", label: "Shipped", date: shipment.shipped_at },
    {
      key: "out_for_delivery",
      label: "Out for delivery",
      date: shipment.out_for_delivery_at,
    },
    { key: "delivered", label: "Delivered", date: shipment.delivered_at },
  ];

  if (normalizeStatus(shipment.status) === "cancelled") {
    return (
      <div className="mt-4 rounded border border-red-100 bg-red-50 p-3 text-sm text-red-700">
        This shipment has been cancelled.
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-x-auto pb-1">
      <div className="relative min-w-[400px]">
        <div className="absolute left-[12.5%] right-[12.5%] top-3 h-[3px] bg-gray-200" />

        <div
          className="absolute left-[12.5%] top-3 h-[3px] bg-[#00875A] transition-all"
          style={{
            width: `${Math.max(
              0,
              Math.min(75, ((progress - 1) / 3) * 75),
            )}%`,
          }}
        />

        <div className="relative grid grid-cols-4">
          {steps.map((step, index) => {
            const complete = index + 1 <= progress;

            return (
              <div key={step.key} className="text-center">
                <div
                  className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    complete
                      ? "border-[#00875A] bg-[#00875A] text-white"
                      : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {complete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-[10px]">{index + 1}</span>
                  )}
                </div>

                <p
                  className={`mt-2 text-xs ${
                    complete ? "font-medium text-gray-800" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>

                {step.date && (
                  <p className="mt-1 text-[10px] text-gray-400">
                    {formatDate(step.date)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderShipments, setOrderShipments] = useState<
    Record<number, Shipment[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("all");

  const [loadingShipments, setLoadingShipments] = useState<
    Record<number, boolean>
  >({});
  const [expandedTracking, setExpandedTracking] = useState<
    Record<number, boolean>
  >({});
  const [loadedShipmentOrderIds, setLoadedShipmentOrderIds] = useState<
    Set<number>
  >(() => new Set());
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(
    null,
  );

  const loadOrdersRequestRef = useRef<Promise<void> | null>(null);
  const loadedShipmentIdsRef = useRef(new Set<number>());
  const shipmentRequestsRef = useRef(new Map<number, Promise<void>>());

  const loadOrders = useCallback(async (showLoader = true) => {
    if (loadOrdersRequestRef.current) {
      return loadOrdersRequestRef.current;
    }

    const request = (async () => {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await getMyOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Unable to load orders",
          text:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
          confirmButtonColor: "#2874F0",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    })();

    loadOrdersRequestRef.current = request;

    try {
      await request;
    } finally {
      if (loadOrdersRequestRef.current === request) {
        loadOrdersRequestRef.current = null;
      }
    }
  }, []);

  const loadOrderShipments = useCallback(async (orderId: number) => {
    if (loadedShipmentIdsRef.current.has(orderId)) return;

    const existingRequest = shipmentRequestsRef.current.get(orderId);

    if (existingRequest) return existingRequest;

    const request = (async () => {
      setLoadingShipments((previous) => ({
        ...previous,
        [orderId]: true,
      }));

      try {
        const result = await getCustomerOrderShipments(orderId);
        const shipments = Array.isArray(result.shipments)
          ? result.shipments
          : [];

        setOrderShipments((previous) => ({
          ...previous,
          [orderId]: shipments,
        }));

        loadedShipmentIdsRef.current.add(orderId);

        setLoadedShipmentOrderIds((previous) => {
          const next = new Set(previous);
          next.add(orderId);
          return next;
        });
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Unable to load tracking",
          text:
            error instanceof Error
              ? error.message
              : "Could not load shipment details.",
          confirmButtonColor: "#2874F0",
        });
      } finally {
        setLoadingShipments((previous) => ({
          ...previous,
          [orderId]: false,
        }));

        shipmentRequestsRef.current.delete(orderId);
      }
    })();

    shipmentRequestsRef.current.set(orderId, request);
    return request;
  }, []);

  async function handleTrackingClick(orderId: number) {
    if (expandedTracking[orderId]) {
      setExpandedTracking((previous) => ({
        ...previous,
        [orderId]: false,
      }));
      return;
    }

    setExpandedTracking((previous) => ({
      ...previous,
      [orderId]: true,
    }));

    if (!loadedShipmentIdsRef.current.has(orderId)) {
      await loadOrderShipments(orderId);
    }
  }

  async function handleCancelOrder(orderId: number) {
    if (cancellingOrderId !== null) return;

    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Cancel this order?",
      text: "Are you sure you want to cancel this order?",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel order",
      cancelButtonText: "Keep order",
      confirmButtonColor: "#C62828",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    try {
      setCancellingOrderId(orderId);

      await cancelOrder(orderId);

      await Swal.fire({
        icon: "success",
        title: "Order cancelled",
        text: "Your order has been cancelled successfully.",
        confirmButtonColor: "#2874F0",
      });

      loadedShipmentIdsRef.current.delete(orderId);

      setLoadedShipmentOrderIds((previous) => {
        const next = new Set(previous);
        next.delete(orderId);
        return next;
      });

      setOrderShipments((previous) => {
        const next = { ...previous };
        delete next[orderId];
        return next;
      });

      await loadOrders(false);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Unable to cancel order",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        confirmButtonColor: "#2874F0",
      });
    } finally {
      setCancellingOrderId(null);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const status = normalizeStatus(order.status);

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "open" &&
          ["pending", "processing", "shipped", "out_for_delivery"].includes(
            status,
          )) ||
        (activeFilter === "delivered" && status === "delivered") ||
        (activeFilter === "cancelled" && status === "cancelled");

      if (!matchesFilter) return false;
      if (!query) return true;

      const searchableText = [
        String(order.id),
        order.status,
        order.payment_status,
        order.coupon_code ?? "",
        ...(order.items ?? []).flatMap((item) => [
          item.product_name,
          String(item.product_id),
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [orders, searchText, activeFilter]);

  const filterTabs: { id: OrderFilter; label: string }[] = [
    { id: "all", label: "All Orders" },
    { id: "open", label: "Open Orders" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f1f3f6] px-3 py-5 sm:px-6">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-4 md:grid-cols-[245px_minmax(0,1fr)]">
            <div className="hidden h-72 animate-pulse bg-white md:block" />
            <div className="animate-pulse bg-white p-5">
              <div className="h-8 w-40 bg-gray-200" />
              <div className="mt-5 h-12 bg-gray-100" />
              <div className="mt-4 h-36 bg-gray-100" />
              <div className="mt-4 h-36 bg-gray-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f3f6] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#2874F0]">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-800">My Orders</span>
        </div>

        <div className="grid items-start gap-4 md:grid-cols-[245px_minmax(0,1fr)]">
          <aside className="hidden space-y-3 md:block">
            <div className="border border-gray-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <Link
                href="/orders"
                className="flex items-center gap-3 border-l-[3px] border-[#2874F0] bg-[#F5F9FF] px-4 py-4 text-sm font-semibold text-[#2874F0]"
              >
                <ShoppingBag className="h-[18px] w-[18px]" />
                My Orders
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>

              <div className="border-t border-gray-100 px-4 py-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Account settings
                </p>

                <Link
                  href="/profile"
                  className="flex items-center gap-3 py-2 text-sm text-gray-700 hover:text-[#2874F0]"
                >
                  <UserRound className="h-[17px] w-[17px] text-gray-400" />
                  Profile Information
                </Link>

                <Link
                  href="/addresses"
                  className="flex items-center gap-3 py-2 text-sm text-gray-700 hover:text-[#2874F0]"
                >
                  <MapPin className="h-[17px] w-[17px] text-gray-400" />
                  Manage Addresses
                </Link>
              </div>

              <div className="border-t border-gray-100 px-4 py-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  My activity
                </p>

                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 py-2 text-sm text-gray-700 hover:text-[#2874F0]"
                >
                  <CheckCircle2 className="h-[17px] w-[17px] text-gray-400" />
                  My Wishlist
                </Link>

                <Link
                  href="/cart"
                  className="flex items-center gap-3 py-2 text-sm text-gray-700 hover:text-[#2874F0]"
                >
                  <ShoppingBag className="h-[17px] w-[17px] text-gray-400" />
                  My Cart
                </Link>
              </div>
            </div>

            <div className="border border-gray-100 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <HelpCircle className="h-5 w-5 text-[#2874F0]" />
                Need Help?
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Check the status of your orders or open an order to see its
                details.
              </p>

              <Link
                href="/products"
                className="mt-3 inline-block text-xs font-semibold text-[#2874F0] hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="border border-gray-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      My Orders
                    </h1>
                    <p className="mt-1 text-xs text-gray-500">
                      {orders.length} {orders.length === 1 ? "order" : "orders"}{" "}
                      placed
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void loadOrders(false)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 self-start border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-[#2874F0] hover:text-[#2874F0] disabled:opacity-60 sm:self-auto"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        refreshing ? "animate-spin" : ""
                      }`}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                <form
                  className="mt-4 flex w-full"
                  onSubmit={(event) => event.preventDefault()}
                >
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Search your orders here"
                      aria-label="Search orders"
                      className="h-10 w-full border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#2874F0]"
                    />
                  </div>

                  {searchText && (
                    <button
                      type="button"
                      onClick={() => setSearchText("")}
                      aria-label="Clear search"
                      className="flex h-10 w-10 shrink-0 items-center justify-center border border-l-0 border-gray-300 text-gray-500 hover:bg-gray-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="submit"
                    className="h-10 shrink-0 bg-[#2874F0] px-4 text-sm font-semibold text-white hover:bg-[#1f65d5] sm:px-7"
                  >
                    Search
                  </button>
                </form>
              </div>

              <div className="flex overflow-x-auto border-b border-gray-200">
                {filterTabs.map((tab) => {
                  const selected = activeFilter === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      className={`relative shrink-0 px-4 py-4 text-xs font-medium transition sm:px-6 sm:text-sm ${
                        selected
                          ? "text-[#2874F0]"
                          : "text-gray-600 hover:text-[#2874F0]"
                      }`}
                    >
                      {tab.label}
                      {selected && (
                        <span className="absolute bottom-0 left-0 h-[3px] w-full bg-[#2874F0]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="px-5 py-16 text-center sm:py-20">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F7FA]">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>

                  <h2 className="mt-4 text-base font-semibold text-gray-800">
                    {orders.length === 0
                      ? "You have not placed any orders yet"
                      : "No matching orders found"}
                  </h2>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                    {orders.length === 0
                      ? "Your purchases will appear here when you place an order."
                      : "Try another search term or select a different order filter."}
                  </p>

                  {orders.length === 0 ? (
                    <Link
                      href="/products"
                      className="mt-5 inline-flex items-center justify-center bg-[#2874F0] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1f65d5]"
                    >
                      Shop Now
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchText("");
                        setActiveFilter("all");
                      }}
                      className="mt-5 text-sm font-semibold text-[#2874F0] hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {filteredOrders.map((order) => {
                    const shipments = orderShipments[order.id] ?? [];
                    const trackingLoaded = loadedShipmentOrderIds.has(order.id);
                    const trackingExpanded = Boolean(
                      expandedTracking[order.id],
                    );
                    const isLoadingTracking = Boolean(
                      loadingShipments[order.id],
                    );
                    const isCancelling = cancellingOrderId === order.id;

                    const status = normalizeStatus(order.status);

                    const canCancel =
                      ["pending", "processing"].includes(status) &&
                      (!trackingLoaded ||
                        shipments.length === 0 ||
                        shipments.every((shipment) =>
                          ["processing", "pending"].includes(
                            normalizeStatus(shipment.status),
                          ),
                        ));

                    const StatusIcon = getStatusIcon(order.status);

                    return (
                      <article
                        key={order.id}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        {(order.items ?? []).map((item, index) => (
                          <div
                            key={item.id}
                            className={`grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-[80px_minmax(0,1fr)] sm:gap-4 sm:px-5 ${
                              index > 0 ? "border-t border-gray-100" : ""
                            }`}
                          >
                            <Link
                              href={`/products/${item.product_id}`}
                              className="flex h-20 w-20 items-center justify-center justify-self-start overflow-hidden bg-white"
                            >
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  loading="lazy"
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <Package className="h-10 w-10 text-gray-300" />
                              )}
                            </Link>

                            <div className="min-w-0">
                              <Link
                                href={`/products/${item.product_id}`}
                                className="line-clamp-2 text-sm font-medium text-gray-800 hover:text-[#2874F0]"
                              >
                                {item.product_name}
                              </Link>

                              <p className="mt-1 text-xs text-gray-500">
                                Product ID: {item.product_id}
                              </p>

                              <p className="mt-2 text-xs text-gray-500">
                                {formatCurrency(Number(item.price || 0))} each
                                <span className="mx-2 text-gray-300">|</span>
                                Qty: {item.quantity}
                              </p>

                              <p
                                className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${getStatusColor(
                                  order.status,
                                )}`}
                              >
                                <StatusIcon className="h-4 w-4 shrink-0" />
                                {formatStatus(order.status)}
                              </p>

                              {status === "delivered" && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Your item has been delivered.
                                </p>
                              )}

                              {status === "cancelled" && (
                                <p className="mt-1 text-xs text-gray-500">
                                  This order has been cancelled.
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                        <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs text-gray-500">
                                Order total
                              </p>

                              <p className="mt-0.5 text-base font-semibold text-gray-900">
                                {formatCurrency(
                                  Number(order.total_amount || 0),
                                )}
                              </p>

                              <span
                                className={`mt-1 inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-medium ${getPaymentStatusClass(
                                  order.payment_status,
                                )}`}
                              >
                                Payment: {formatStatus(order.payment_status)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleTrackingClick(order.id)
                                }
                                disabled={isLoadingTracking}
                                className="inline-flex min-h-8 items-center justify-center gap-1.5 border border-gray-300 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 hover:border-[#2874F0] hover:text-[#2874F0] disabled:opacity-60"
                              >
                                {isLoadingTracking ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Truck className="h-3.5 w-3.5" />
                                )}

                                {isLoadingTracking
                                  ? "Loading..."
                                  : trackingExpanded
                                    ? "Hide Tracking"
                                    : "Track Order"}

                                {!isLoadingTracking && (
                                  <ChevronDown
                                    className={`h-3 w-3 transition-transform ${
                                      trackingExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                )}
                              </button>

                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleCancelOrder(order.id)
                                  }
                                  disabled={isCancelling}
                                  className="inline-flex min-h-8 items-center justify-center gap-1.5 border border-gray-300 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-60"
                                >
                                  {isCancelling ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5" />
                                  )}

                                  {isCancelling ? "Cancelling..." : "Cancel"}
                                </button>
                              )}

                              <Link
                                href={`/orders/${order.id}`}
                                className="inline-flex min-h-8 items-center justify-center gap-1.5 bg-[#2874F0] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1f65d5]"
                              >
                                View Order
                                <ChevronRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </div>

                        {trackingExpanded && (
                          <div className="border-t border-gray-100 bg-[#FAFBFD] px-4 py-4 sm:px-5">
                            <div className="mb-4 flex items-center gap-2">
                              <Truck className="h-4 w-4 text-[#2874F0]" />
                              <h3 className="text-sm font-semibold text-gray-800">
                                Delivery updates
                              </h3>
                            </div>

                            {isLoadingTracking ? (
                              <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Loading shipment information...
                              </div>
                            ) : shipments.length === 0 ? (
                              <p className="border border-gray-100 bg-white p-4 text-sm text-gray-500">
                                Shipment tracking is not available yet.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {shipments.map((shipment) => (
                                  <div
                                    key={shipment.id}
                                    className="border border-gray-200 bg-white p-4"
                                  >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                          Seller #{shipment.seller_id}
                                        </p>

                                        {shipment.tracking_number && (
                                          <p className="mt-1 break-all text-xs text-gray-500">
                                            Tracking number:{" "}
                                            <span className="font-medium text-gray-800">
                                              {shipment.tracking_number}
                                            </span>
                                          </p>
                                        )}

                                        {shipment.expected_delivery_date && (
                                          <p className="mt-2 text-xs text-gray-600">
                                            Expected delivery:{" "}
                                            {formatDate(
                                              shipment.expected_delivery_date,
                                            )}
                                          </p>
                                        )}
                                      </div>

                                      <span
                                        className={`text-xs font-semibold ${getStatusColor(
                                          shipment.status,
                                        )}`}
                                      >
                                        {formatStatus(shipment.status)}
                                      </span>
                                    </div>

                                    <ShipmentTimeline shipment={shipment} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {filteredOrders.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-gray-100 bg-white px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <span>
                    Showing {filteredOrders.length} of {orders.length} orders
                  </span>

                  {searchText && (
                    <button
                      type="button"
                      onClick={() => setSearchText("")}
                      className="inline-flex items-center gap-1 self-start text-[#2874F0] hover:underline sm:self-auto"
                    >
                      <X className="h-3 w-3" />
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 py-3 text-xs text-gray-500">
              <CreditCard className="h-4 w-4" />
              Your order and payment information is managed securely by
              ShopSphere.
            </div>
          </section>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 hover:text-[#2874F0]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Continue shopping
          </Link>

          <span className="inline-flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            ShopSphere Orders
          </span>
        </div>
      </div>
    </main>
  );
}