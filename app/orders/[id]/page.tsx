
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

import {
  getOrder,
  getCustomerOrderShipments,
  type Order,
  type Shipment,
  type PaymentStatus,
} from "@/services/orders";

import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  type Review,
} from "@/services/reviews";

const BLUE = "#2874F0";

function normalizeStatus(status: string | null | undefined) {
  return (status || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
}

function formatStatus(status: string | null | undefined) {
  if (!status) return "Unknown";

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClass(status: string) {
  switch (normalizeStatus(status)) {
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "processing":
      return "bg-blue-50 text-blue-700";
    case "shipped":
      return "bg-indigo-50 text-indigo-700";
    case "out_for_delivery":
      return "bg-purple-50 text-purple-700";
    case "delivered":
      return "bg-green-50 text-green-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getPaymentStatusClass(status: string | null | undefined) {
  switch (normalizeStatus(status)) {
    case "paid":
      return "bg-green-50 text-green-700";

    case "refunded":
    case "partially_refunded":
      return "bg-blue-50 text-blue-700";

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
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * Prefer a confirmed refund status when either API reports one.
 * Otherwise, use the payment status returned by the order endpoint.
 *
 * Cancellation of an order does not by itself mean that a refund
 * has been completed.
 */
function resolvePaymentStatus(
  orderPaymentStatus: PaymentStatus | null | undefined,
  shipmentPaymentStatus: PaymentStatus | null | undefined,
): PaymentStatus {
  const orderStatus = normalizeStatus(orderPaymentStatus);
  const shipmentStatus = normalizeStatus(shipmentPaymentStatus);

  const statuses = [orderStatus, shipmentStatus];

  if (statuses.includes("partially_refunded")) {
    return "partially_refunded";
  }

  if (statuses.includes("refunded")) {
    return "refunded";
  }

  if (
    statuses.includes("refund_pending") ||
    statuses.includes("pending_refund") ||
    statuses.includes("processing_refund")
  ) {
    return "refund_pending";
  }

  if (
    statuses.includes("refund_failed") &&
    orderStatus !== "paid"
  ) {
    return "refund_failed";
  }

  return orderPaymentStatus || shipmentPaymentStatus || "pending";
}

function getStatusIcon(status: string) {
  switch (normalizeStatus(status)) {
    case "delivered":
      return CheckCircle2;
    case "shipped":
    case "out_for_delivery":
      return Truck;
    case "cancelled":
      return X;
    default:
      return Clock3;
  }
}

function formatDate(date?: string | null) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number) {
  const safeAmount = Number(amount);

  return `₹${(
    Number.isFinite(safeAmount) ? safeAmount : 0
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatAddressLines(address: unknown): string[] {
  if (address === null || address === undefined || address === "") {
    return ["No delivery address available."];
  }

  if (typeof address === "string") {
    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      return ["No delivery address available."];
    }

    try {
      const parsed: unknown = JSON.parse(trimmedAddress);

      if (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return formatAddressLines(parsed);
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

    const fieldGroups: string[][] = [
      ["full_name", "name", "recipient_name", "recipient"],
      ["phone", "phone_number", "mobile", "mobile_number"],
      ["address_line1", "address_line_1", "line1", "street"],
      ["address_line2", "address_line_2", "line2"],
      ["landmark"],
      ["city", "district", "town"],
      ["state", "province"],
      ["postal_code", "pincode", "zip_code", "postcode"],
      ["country"],
    ];

    const lines: string[] = [];

    for (const group of fieldGroups) {
      for (const key of group) {
        const value = data[key];

        if (
          (typeof value === "string" || typeof value === "number") &&
          String(value).trim()
        ) {
          lines.push(String(value).trim());
          break;
        }
      }
    }

    if (lines.length > 0) {
      return [...new Set(lines)];
    }

    return [JSON.stringify(address, null, 2)];
  }

  if (Array.isArray(address)) {
    const lines = address
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);

    return lines.length > 0
      ? lines
      : ["No delivery address available."];
  }

  return [String(address)];
}

function getLatestOrderStatus(
  orderStatus: string,
  shipments: Shipment[],
) {
  const currentStatus = normalizeStatus(orderStatus);

  if (currentStatus === "cancelled") {
    return "cancelled";
  }

  if (!shipments.length) {
    return currentStatus || "processing";
  }

  const statuses = shipments.map((shipment) =>
    normalizeStatus(shipment.status),
  );

  if (statuses.every((status) => status === "delivered")) {
    return "delivered";
  }

  if (statuses.some((status) => status === "out_for_delivery")) {
    return "out_for_delivery";
  }

  if (
    statuses.some(
      (status) => status === "shipped" || status === "delivered",
    )
  ) {
    return "shipped";
  }

  if (statuses.some((status) => status === "processing")) {
    return "processing";
  }

  return currentStatus || "processing";
}

function StarRating({
  rating,
  interactive = false,
  onChange,
  size = "h-5 w-5",
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: string;
}) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) =>
        interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            aria-label={`Rate ${star} out of 5 stars`}
            aria-pressed={rating === star}
            className="rounded-sm transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <Star
              className={`${size} ${
                star <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ) : (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        ),
      )}
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2874F0]">
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="text-base font-semibold text-gray-900">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function DropdownHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <SectionHeading
        icon={icon}
        title={title}
        subtitle={subtitle}
      />

      <ChevronRight className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-open:rotate-90" />
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const rawOrderId = params.id;

  const orderId = Number(
    Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId,
  );

  const [order, setOrder] = useState<Order | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    null,
  );

  const [reviewsByProduct, setReviewsByProduct] = useState<
    Record<number, Review[]>
  >({});

  const [reviewsLoading, setReviewsLoading] = useState<
    Record<number, boolean>
  >({});

  const [reviewFormProductId, setReviewFormProductId] = useState<
    number | null
  >(null);

  const [editingReviewId, setEditingReviewId] = useState<number | null>(
    null,
  );

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userId = user?.id ?? user?.user_id;

        if (userId !== undefined && userId !== null) {
          setCurrentUserId(String(userId));
        }
      }
    } catch (error) {
      console.error("Unable to read the current user:", error);
    }
  }, []);

  const loadOrder = useCallback(
    async (showLoader = true) => {
      if (!Number.isInteger(orderId) || orderId <= 0) {
        setOrder(null);
        setShipments([]);
        setLoading(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await getOrder(orderId);

        // Initially use the order endpoint response.
        setOrder(data);

        try {
          const shipmentData =
            await getCustomerOrderShipments(orderId);

          const latestShipments = Array.isArray(
            shipmentData.shipments,
          )
            ? shipmentData.shipments
            : [];

          setShipments(latestShipments);

          const latestStatus = getLatestOrderStatus(
            shipmentData.order_status || data.status,
            latestShipments,
          );

          // Update shipment/order delivery status without blindly
          // overwriting payment status with the shipment response.
          setOrder((previous) => {
            if (!previous) return previous;

            return {
              ...previous,
              status: latestStatus,
              payment_status: resolvePaymentStatus(
                previous.payment_status,
                shipmentData.payment_status,
              ),
            };
          });
        } catch (shipmentError) {
          console.error(
            "Failed to load the latest shipment information:",
            shipmentError,
          );
        }
      } catch (error) {
        console.error("Failed to load order:", error);

        if (showLoader) {
          await Swal.fire({
            icon: "error",
            title: "Unable to load order",
            text: getErrorMessage(error),
            confirmButtonColor: BLUE,
          });

          router.push("/orders");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId, router],
  );

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadOrder(false);
      }
    }

    function handleWindowFocus() {
      void loadOrder(false);
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener("focus", handleWindowFocus);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadOrder(false);
      }
    }, 15000);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener("focus", handleWindowFocus);
      window.clearInterval(intervalId);
    };
  }, [loadOrder]);

  const loadReviews = useCallback(async (productIds: number[]) => {
    for (const productId of [...new Set(productIds)]) {
      setReviewsLoading((previous) => ({
        ...previous,
        [productId]: true,
      }));

      try {
        const reviews = await getProductReviews(productId);

        setReviewsByProduct((previous) => ({
          ...previous,
          [productId]: Array.isArray(reviews) ? reviews : [],
        }));
      } catch (error) {
        console.error(
          `Failed to load reviews for product ${productId}:`,
          error,
        );

        setReviewsByProduct((previous) => ({
          ...previous,
          [productId]: previous[productId] ?? [],
        }));
      } finally {
        setReviewsLoading((previous) => ({
          ...previous,
          [productId]: false,
        }));
      }
    }
  }, []);

  const productIds = useMemo(
    () => (order?.items ?? []).map((item) => item.product_id),
    [order],
  );

  useEffect(() => {
    if (productIds.length === 0) return;

    void loadReviews(productIds);
  }, [productIds, loadReviews]);

  function getMyReview(productId: number) {
    if (!currentUserId) return undefined;

    return (reviewsByProduct[productId] ?? []).find(
      (review) => String(review.user_id) === currentUserId,
    );
  }

  function openCreateReview(productId: number) {
    setReviewFormProductId(productId);
    setEditingReviewId(null);
    setReviewRating(5);
    setReviewComment("");
  }

  function openEditReview(review: Review) {
    setReviewFormProductId(review.product_id);
    setEditingReviewId(review.id);
    setReviewRating(review.rating);
    setReviewComment(review.comment ?? "");
  }

  function closeReviewForm() {
    setReviewFormProductId(null);
    setEditingReviewId(null);
    setReviewRating(5);
    setReviewComment("");
  }

  async function handleReviewSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (reviewFormProductId === null || savingReview) return;

    if (!currentUserId) {
      await Swal.fire({
        icon: "warning",
        title: "Please log in again",
        text: "We could not identify your account. Log in again before submitting a review.",
        confirmButtonColor: BLUE,
      });

      router.push("/login");
      return;
    }

    if (normalizeStatus(order?.status ?? "") !== "delivered") {
      await Swal.fire({
        icon: "info",
        title: "Order not delivered",
        text: "You can review products after your order has been delivered.",
        confirmButtonColor: BLUE,
      });

      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      await Swal.fire({
        icon: "warning",
        title: "Select a rating",
        text: "Please select between 1 and 5 stars.",
        confirmButtonColor: BLUE,
      });

      return;
    }

    const comment = reviewComment.trim();

    if (!comment) {
      await Swal.fire({
        icon: "warning",
        title: "Write your review",
        text: "Please enter a few words about the product.",
        confirmButtonColor: BLUE,
      });

      return;
    }

    setSavingReview(true);

    try {
      const productId = reviewFormProductId;
      const wasEditing = editingReviewId !== null;

      if (editingReviewId !== null) {
        await updateReview(editingReviewId, {
          rating: reviewRating,
          comment,
        });
      } else {
        await createReview({
          product_id: productId,
          rating: reviewRating,
          comment,
        });
      }

      const refreshedReviews = await getProductReviews(productId);

      setReviewsByProduct((previous) => ({
        ...previous,
        [productId]: Array.isArray(refreshedReviews)
          ? refreshedReviews
          : [],
      }));

      closeReviewForm();

      await Swal.fire({
        icon: "success",
        title: wasEditing ? "Review updated" : "Review submitted",
        text: wasEditing
          ? "Your review has been updated successfully."
          : "Thank you for sharing your experience.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to save review:", error);

      await Swal.fire({
        icon: "error",
        title: "Unable to save review",
        text: getErrorMessage(error),
        confirmButtonColor: BLUE,
      });
    } finally {
      setSavingReview(false);
    }
  }

  async function handleDeleteReview(review: Review) {
    if (deletingReviewId !== null) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete your review?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Keep review",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setDeletingReviewId(review.id);

    try {
      await deleteReview(review.id);

      const refreshedReviews = await getProductReviews(
        review.product_id,
      );

      setReviewsByProduct((previous) => ({
        ...previous,
        [review.product_id]: Array.isArray(refreshedReviews)
          ? refreshedReviews
          : [],
      }));

      if (editingReviewId === review.id) {
        closeReviewForm();
      }

      await Swal.fire({
        icon: "success",
        title: "Review deleted",
        text: "Your review has been deleted.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to delete review:", error);

      await Swal.fire({
        icon: "error",
        title: "Unable to delete review",
        text: getErrorMessage(error),
        confirmButtonColor: BLUE,
      });
    } finally {
      setDeletingReviewId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f1f3f6] px-3 py-6 sm:px-5">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-4 h-5 w-36 animate-pulse bg-gray-200" />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <div className="h-36 animate-pulse bg-white" />
              <div className="h-72 animate-pulse bg-white" />
            </div>

            <div className="h-80 animate-pulse bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#f1f3f6] px-4 py-10">
        <div className="mx-auto max-w-3xl border border-gray-100 bg-white p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />

          <h1 className="mt-4 text-lg font-semibold text-gray-900">
            Order not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            We could not find the requested order.
          </p>

          <Link
            href="/orders"
            className="mt-5 inline-flex items-center gap-2 bg-[#2874F0] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  const normalizedOrderStatus = normalizeStatus(order.status);
  const normalizedPaymentStatus = normalizeStatus(order.payment_status);
  const orderDelivered = normalizedOrderStatus === "delivered";
  const orderCancelled = normalizedOrderStatus === "cancelled";
  const items = order.items ?? [];

  const itemsSubtotal = items.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0,
  );

  const couponDiscount = Math.max(
    0,
    Number(order.discount_amount || 0),
  );

  const couponCode = order.coupon_code?.trim() ?? "";
  const hasCoupon = couponCode.length > 0;
  const finalOrderTotal = Number(order.total_amount || 0);

  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  const StatusIcon = getStatusIcon(order.status);

  const progressWidth =
    normalizedOrderStatus === "delivered"
      ? "calc(100% - 24px)"
      : normalizedOrderStatus === "out_for_delivery"
        ? "66%"
        : normalizedOrderStatus === "shipped"
          ? "33%"
          : normalizedOrderStatus === "processing"
            ? "0%"
            : "0%";

  return (
    <main className="min-h-screen bg-[#f1f3f6] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-[#2874F0]">
              Home
            </Link>

            <ChevronRight className="h-3 w-3" />

            <Link href="/orders" className="hover:text-[#2874F0]">
              My Orders
            </Link>

            <ChevronRight className="h-3 w-3" />

            <span className="font-medium text-gray-800">
              Order #{order.id}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void loadOrder(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-[#2874F0] hover:text-[#2874F0] disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            {refreshing ? "Refreshing..." : "Refresh status"}
          </button>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <section className="border border-gray-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-500">
                      ORDER DETAILS
                    </p>

                    <h1 className="mt-1 text-xl font-semibold text-gray-900">
                      Order #{order.id}
                    </h1>

                    <p className="mt-1 text-xs text-gray-500">
                      Placed on{" "}
                      {formatDateTime(order.created_at) ||
                        "Date unavailable"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                        order.status,
                      )}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {formatStatus(order.status)}
                    </span>

                    <span
                      className={`rounded-sm px-3 py-1.5 text-xs font-semibold ${getPaymentStatusClass(
                        order.payment_status,
                      )}`}
                    >
                      Payment: {formatStatus(order.payment_status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-5 sm:px-6">
                {orderCancelled ? (
                  <div className="border border-red-100 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-700">
                      This order has been cancelled.
                    </p>

                    <p className="mt-1 text-xs text-red-600">
                      Refer to the order details below for the saved
                      payment and item information.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3 right-3 top-[11px] h-[3px] bg-gray-200" />

                    <div
                      className="absolute left-3 top-[11px] h-[3px] bg-[#00875A] transition-all"
                      style={{ width: progressWidth }}
                    />

                    <div className="relative grid grid-cols-4">
                      {[
                        { label: "Ordered", done: true },
                        {
                          label: "Processing",
                          done: [
                            "processing",
                            "shipped",
                            "out_for_delivery",
                            "delivered",
                          ].includes(normalizedOrderStatus),
                        },
                        {
                          label: "Shipped",
                          done: [
                            "shipped",
                            "out_for_delivery",
                            "delivered",
                          ].includes(normalizedOrderStatus),
                        },
                        {
                          label: "Delivered",
                          done: orderDelivered,
                        },
                      ].map((step) => (
                        <div
                          key={step.label}
                          className="flex flex-col items-center text-center"
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                              step.done
                                ? "border-[#00875A] bg-[#00875A] text-white"
                                : "border-gray-300 bg-white text-gray-400"
                            }`}
                          >
                            {step.done ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <span className="text-[10px]">•</span>
                            )}
                          </div>

                          <p
                            className={`mt-2 text-[10px] sm:text-xs ${
                              step.done
                                ? "font-semibold text-gray-800"
                                : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <details className="group mt-5 border-t border-gray-100 pt-4">
                  <summary className="cursor-pointer list-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2874F0]">
                    <DropdownHeading
                      icon={<Truck className="h-5 w-5" />}
                      title="Delivery Shipment"
                      subtitle={
                        shipments.length > 0
                          ? `${shipments.length} ${
                              shipments.length === 1
                                ? "shipment"
                                : "shipments"
                            } available. Click to view tracking details.`
                          : "Click to view shipment information."
                      }
                    />
                  </summary>

                  <div className="mt-4 space-y-3">
                    {shipments.length === 0 ? (
                      <p className="border border-dashed border-gray-200 p-4 text-xs text-gray-500">
                        Shipment details are not available yet.
                      </p>
                    ) : (
                      shipments.map((shipment) => (
                        <div
                          key={shipment.id}
                          className="min-w-0 border border-gray-100 bg-[#fafbfc] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs text-gray-500">
                              Shipment #{shipment.id}
                            </span>

                            <span
                              className={`rounded-sm px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                                shipment.status,
                              )}`}
                            >
                              {formatStatus(shipment.status)}
                            </span>
                          </div>

                          <div className="mt-4 min-w-0 border-t border-gray-200 pt-3">
                            <p className="text-xs font-semibold text-gray-700">
                              Tracking Number
                            </p>

                            {shipment.tracking_number?.trim() ? (
                              <p className="mt-2 break-words text-sm font-semibold text-gray-900 [overflow-wrap:anywhere]">
                                {shipment.tracking_number}
                              </p>
                            ) : (
                              <p className="mt-2 text-xs text-gray-500">
                                No tracking number added yet.
                              </p>
                            )}
                          </div>

                          {shipment.shipped_at && (
                            <p className="mt-3 text-xs text-gray-600">
                              <span className="font-medium">
                                Shipped:
                              </span>{" "}
                              {formatDateTime(shipment.shipped_at)}
                            </p>
                          )}

                          {shipment.out_for_delivery_at && (
                            <p className="mt-2 text-xs text-purple-700">
                              <span className="font-medium">
                                Out for delivery:
                              </span>{" "}
                              {formatDateTime(
                                shipment.out_for_delivery_at,
                              )}
                            </p>
                          )}

                          {shipment.delivered_at && (
                            <p className="mt-2 text-xs text-green-700">
                              <span className="font-medium">
                                Delivered:
                              </span>{" "}
                              {formatDateTime(shipment.delivered_at)}
                            </p>
                          )}

                          {shipment.expected_delivery_date && (
                            <p className="mt-2 text-xs text-gray-600">
                              <span className="font-medium">
                                Expected delivery:
                              </span>{" "}
                              {formatDate(
                                shipment.expected_delivery_date,
                              )}
                            </p>
                          )}

                          <details className="group mt-4 border-t border-gray-200 pt-3">
                            <summary className="cursor-pointer list-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2874F0]">
                              <DropdownHeading
                                icon={<Clock3 className="h-5 w-5" />}
                                title="Delivery Timeline"
                                subtitle="Click to view shipment progress and dates."
                              />
                            </summary>

                            <div className="mt-4 space-y-3">
                              <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2874F0]" />
                                  <span className="mt-1 h-full min-h-4 w-px bg-gray-200" />
                                </div>

                                <div className="min-w-0 pb-2">
                                  <p className="text-xs font-medium text-gray-800">
                                    Processing: Created
                                  </p>

                                  {shipment.created_at && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      {formatDateTime(
                                        shipment.created_at,
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {shipment.shipped_at && (
                                <div className="flex gap-3">
                                  <div className="flex flex-col items-center">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                    <span className="mt-1 h-full min-h-4 w-px bg-gray-200" />
                                  </div>

                                  <div className="min-w-0 pb-2">
                                    <p className="text-xs font-medium text-gray-800">
                                      Shipped
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                      {formatDateTime(
                                        shipment.shipped_at,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {shipment.out_for_delivery_at && (
                                <div className="flex gap-3">
                                  <div className="flex flex-col items-center">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-purple-500" />
                                    <span className="mt-1 h-full min-h-4 w-px bg-gray-200" />
                                  </div>

                                  <div className="min-w-0 pb-2">
                                    <p className="text-xs font-medium text-gray-800">
                                      Out for delivery
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                      {formatDateTime(
                                        shipment.out_for_delivery_at,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {shipment.delivered_at && (
                                <div className="flex gap-3">
                                  <div className="mt-1">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-green-700">
                                      Delivered
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                      {formatDateTime(
                                        shipment.delivered_at,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {!shipment.shipped_at &&
                                !shipment.out_for_delivery_at &&
                                !shipment.delivered_at && (
                                  <p className="border border-dashed border-gray-200 p-3 text-xs text-gray-500">
                                    Your shipment is being processed.
                                    Further timeline updates will appear
                                    here when available.
                                  </p>
                                )}
                            </div>
                          </details>
                        </div>
                      ))
                    )}
                  </div>
                </details>

                <div className="mt-5 flex items-start gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#00875A]" />

                  <p>
                    Delivery information is refreshed from the latest
                    shipment information available from ShopSphere.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-gray-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Products in this order
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {itemCount} {itemCount === 1 ? "item" : "items"}{" "}
                    across {items.length}{" "}
                    {items.length === 1 ? "product" : "products"}
                  </p>
                </div>

                <Package className="h-5 w-5 text-[#2874F0]" />
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No product details are available for this order.
                </div>
              ) : (
                <div>
                  {items.map((item, index) => {
                    const productReviews =
                      reviewsByProduct[item.product_id] ?? [];

                    const myReview = getMyReview(item.product_id);

                    const formIsOpen =
                      reviewFormProductId === item.product_id;

                    const averageRating =
                      productReviews.length > 0
                        ? productReviews.reduce(
                            (total, review) => total + review.rating,
                            0,
                          ) / productReviews.length
                        : 0;

                    return (
                      <div
                        key={item.id}
                        className={
                          index > 0 ? "border-t border-gray-100" : ""
                        }
                      >
                        <div className="grid gap-4 px-4 py-5 sm:grid-cols-[112px_minmax(0,1fr)_140px] sm:px-6">
                          <Link
                            href={`/products/${item.product_id}`}
                            className="flex h-28 w-28 items-center justify-center justify-self-start overflow-hidden bg-white"
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
                              className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-[#2874F0]"
                            >
                              {item.product_name}
                            </Link>

                            <p className="mt-2 text-xs text-gray-500">
                              Product ID: {item.product_id}
                            </p>

                            <p className="mt-2 break-words text-xs text-gray-600">
                              <span className="font-medium text-gray-700">
                                Sold by:
                              </span>{" "}
                              {item.seller_name?.trim() ||
                                (item.seller_id != null
                                  ? `Seller #${item.seller_id}`
                                  : "Seller information unavailable")}
                            </p>

                            <p className="mt-2 text-xs text-gray-500">
                              Quantity: {item.quantity}
                            </p>

                            <p className="mt-2 text-sm font-semibold text-gray-900">
                              {formatCurrency(Number(item.price || 0))}

                              <span className="ml-2 text-xs font-normal text-gray-500">
                                per item
                              </span>
                            </p>

                            <span
                              className={`mt-3 inline-flex rounded-sm px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                order.status,
                              )}`}
                            >
                              {formatStatus(order.status)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-100 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
                            <span className="text-xs text-gray-500 sm:hidden">
                              Item total
                            </span>

                            <div>
                              <p className="text-base font-semibold text-gray-900">
                                {formatCurrency(Number(item.total || 0))}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {item.quantity}{" "}
                                {Number(item.quantity) === 1
                                  ? "item"
                                  : "items"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 bg-[#fafbfc] px-4 py-4 sm:px-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                <MessageSquare className="h-4 w-4 text-[#2874F0]" />
                                Customer reviews
                              </h3>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <StarRating
                                  rating={Math.round(averageRating)}
                                  size="h-4 w-4"
                                />

                                <span className="text-xs text-gray-600">
                                  {productReviews.length > 0
                                    ? `${averageRating.toFixed(1)} / 5 (${productReviews.length} ${
                                        productReviews.length === 1
                                          ? "review"
                                          : "reviews"
                                      })`
                                    : "No ratings yet"}
                                </span>
                              </div>
                            </div>

                            {orderDelivered &&
                              !myReview &&
                              !formIsOpen && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCreateReview(item.product_id)
                                  }
                                  className="inline-flex items-center justify-center gap-2 bg-[#2874F0] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1f65d5]"
                                >
                                  <Star className="h-4 w-4" />
                                  Write a Review
                                </button>
                              )}

                            {orderDelivered &&
                              myReview &&
                              !formIsOpen && (
                                <button
                                  type="button"
                                  onClick={() => openEditReview(myReview)}
                                  className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:border-[#2874F0] hover:text-[#2874F0]"
                                >
                                  <Pencil className="h-4 w-4" />
                                  Edit Your Review
                                </button>
                              )}
                          </div>

                          {!orderDelivered && !orderCancelled && (
                            <p className="mt-3 text-xs text-gray-500">
                              You can review this product after your order
                              has been delivered.
                            </p>
                          )}

                          {reviewsLoading[item.product_id] ? (
                            <p className="mt-4 text-xs text-gray-500">
                              Loading reviews...
                            </p>
                          ) : productReviews.length === 0 ? (
                            <p className="mt-3 text-xs text-gray-500">
                              No reviews have been submitted for this
                              product yet.
                            </p>
                          ) : (
                            <div className="mt-4 space-y-3">
                              {productReviews.map((review) => {
                                const isMyReview =
                                  currentUserId !== null &&
                                  String(review.user_id) === currentUserId;

                                return (
                                  <div
                                    key={review.id}
                                    className="border border-gray-200 bg-white p-4"
                                  >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                          {isMyReview
                                            ? "Your review"
                                            : review.user_name || "Customer"}
                                        </p>

                                        <div className="mt-2 flex items-center gap-2">
                                          <StarRating
                                            rating={review.rating}
                                            size="h-4 w-4"
                                          />

                                          <span className="text-xs text-gray-600">
                                            {review.rating}/5
                                          </span>
                                        </div>
                                      </div>

                                      <p className="text-xs text-gray-500">
                                        {formatDate(
                                          review.updated_at ||
                                            review.created_at,
                                        )}

                                        {review.updated_at &&
                                        review.created_at &&
                                        review.updated_at !==
                                          review.created_at
                                          ? " · Edited"
                                          : ""}
                                      </p>
                                    </div>

                                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                                      {review.comment}
                                    </p>

                                    {isMyReview && (
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openEditReview(review)
                                          }
                                          className="inline-flex items-center gap-2 border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:border-[#2874F0] hover:text-[#2874F0]"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                          Edit
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            void handleDeleteReview(review)
                                          }
                                          disabled={
                                            deletingReviewId !== null
                                          }
                                          className="inline-flex items-center gap-2 border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />

                                          {deletingReviewId === review.id
                                            ? "Deleting..."
                                            : "Delete"}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {formIsOpen && (
                            <form
                              onSubmit={handleReviewSubmit}
                              className="mt-4 border border-gray-200 bg-white p-4 sm:p-5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {editingReviewId !== null
                                      ? "Edit your review"
                                      : "Write a review"}
                                  </h4>

                                  <p className="mt-1 text-xs text-gray-500">
                                    Share your experience with this product.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={closeReviewForm}
                                  disabled={savingReview}
                                  aria-label="Close review form"
                                  className="p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>

                              <div className="mt-5">
                                <label className="text-xs font-semibold text-gray-700">
                                  Your rating
                                </label>

                                <div className="mt-2 flex items-center gap-3">
                                  <StarRating
                                    rating={reviewRating}
                                    interactive
                                    onChange={setReviewRating}
                                    size="h-7 w-7"
                                  />

                                  <span className="text-sm font-semibold text-gray-700">
                                    {reviewRating}/5
                                  </span>
                                </div>
                              </div>

                              <div className="mt-5">
                                <label
                                  htmlFor={`review-comment-${item.product_id}`}
                                  className="text-xs font-semibold text-gray-700"
                                >
                                  Your review
                                </label>

                                <textarea
                                  id={`review-comment-${item.product_id}`}
                                  value={reviewComment}
                                  onChange={(event) =>
                                    setReviewComment(event.target.value)
                                  }
                                  rows={4}
                                  maxLength={2000}
                                  required
                                  placeholder="What did you like or dislike about this product?"
                                  className="mt-2 w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]"
                                />

                                <p className="mt-1 text-right text-xs text-gray-500">
                                  {reviewComment.length}/2000
                                </p>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="submit"
                                  disabled={
                                    savingReview || !reviewComment.trim()
                                  }
                                  className="inline-flex items-center gap-2 bg-[#2874F0] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1f65d5] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {savingReview && (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  )}

                                  {savingReview
                                    ? "Saving..."
                                    : editingReviewId !== null
                                      ? "Update Review"
                                      : "Submit Review"}
                                </button>

                                <button
                                  type="button"
                                  onClick={closeReviewForm}
                                  disabled={savingReview}
                                  className="border border-gray-300 px-5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="min-w-0 border border-gray-100 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6">
              <details className="group">
                <summary className="cursor-pointer list-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2874F0]">
                  <DropdownHeading
                    icon={<MapPin className="h-5 w-5" />}
                    title="Delivery Address"
                    subtitle="Click to view the address associated with this order."
                  />
                </summary>

                <div className="mt-4 min-w-0 space-y-1 border-t border-gray-100 pt-4">
                  {formatAddressLines(order.shipping_address).map(
                    (line, index) => (
                      <p
                        key={`${index}-${line}`}
                        className="break-words text-sm leading-6 text-gray-700 [overflow-wrap:anywhere]"
                      >
                        {line}
                      </p>
                    ),
                  )}
                </div>
              </details>
            </section>

            <section className="border border-gray-100 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6">
              <SectionHeading
                icon={<CreditCard className="h-5 w-5" />}
                title="Payment Information"
                subtitle="Payment status recorded for this order"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-500">
                    Payment status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-sm px-3 py-1.5 text-xs font-semibold ${getPaymentStatusClass(
                      order.payment_status,
                    )}`}
                  >
                    {formatStatus(order.payment_status)}
                  </span>
                </div>

                <ShieldCheck className="h-6 w-6 text-[#00875A]" />
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-5">
            <section className="border border-gray-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Price Details
                </h2>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-gray-600">
                    Price ({itemCount}{" "}
                    {itemCount === 1 ? "item" : "items"})
                  </span>

                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(itemsSubtotal)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-gray-600">
                    Delivery Charges
                  </span>

                  <span className="text-sm font-medium text-green-700">
                    Free
                  </span>
                </div>

                {hasCoupon && (
                  <div className="border border-green-100 bg-green-50 p-3">
                    <div className="flex items-start gap-2">
                      <Tag className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-green-800">
                          Coupon applied
                        </p>

                        <p className="mt-1 break-all text-xs text-green-700">
                          {couponCode}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-green-800">
                        Coupon Discount
                      </span>

                      <span className="text-sm font-semibold text-green-700">
                        −{formatCurrency(couponDiscount)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-300 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      Total Amount
                    </span>

                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(finalOrderTotal)}
                    </span>
                  </div>
                </div>

                {hasCoupon && couponDiscount > 0 && (
                  <div className="flex items-start gap-2 border-t border-gray-100 pt-4 text-xs text-green-700">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />

                    <p>
                      You saved {formatCurrency(couponDiscount)} on this
                      order.
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2 border-t border-gray-100 pt-4 text-xs leading-5 text-gray-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#00875A]" />

                  <p>
                    The final amount shown is taken from your saved
                    ShopSphere order.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
