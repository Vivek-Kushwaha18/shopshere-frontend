
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Star,
  Pencil,
  Trash2,
  X,
  MessageSquare,
  LoaderCircle,
} from "lucide-react";
import Swal from "sweetalert2";

import { getOrder, type Order } from "@/services/orders";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  type Review,
} from "@/services/reviews";

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "out_for_delivery":
      return "bg-indigo-100 text-indigo-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatStatus(status: string) {
  if (!status) return "";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(date: string) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
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
        )
      )}
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const rawOrderId = params.id;
  const orderId = Number(
    Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId
  );

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(
    null
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

  const [editingReviewId, setEditingReviewId] = useState<
    number | null
  >(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const [savingReview, setSavingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<
    number | null
  >(null);

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
        setLoading(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (error) {
        console.error("Failed to load order:", error);

        if (!showLoader) return;

        await Swal.fire({
          icon: "error",
          title: "Unable to load order",
          text: getErrorMessage(error),
        });

        router.push("/orders");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [orderId, router]
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
      handleVisibilityChange
    );
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener("focus", handleWindowFocus);
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
          error
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

  useEffect(() => {
    if (!order?.items?.length) return;

    void loadReviews(order.items.map((item) => item.product_id));
  }, [order, loadReviews]);

  function getMyReview(productId: number) {
    if (!currentUserId) return undefined;

    return (reviewsByProduct[productId] ?? []).find(
      (review) => String(review.user_id) === currentUserId
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
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (reviewFormProductId === null || savingReview) return;

    if (!currentUserId) {
      await Swal.fire({
        icon: "warning",
        title: "Please log in again",
        text: "We could not identify your account. Log in again before submitting a review.",
      });

      router.push("/login");
      return;
    }

    if (order?.status?.toLowerCase() !== "delivered") {
      await Swal.fire({
        icon: "info",
        title: "Order not delivered",
        text: "You can review products after your order has been delivered.",
      });
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      await Swal.fire({
        icon: "warning",
        title: "Select a rating",
        text: "Please select between 1 and 5 stars.",
      });
      return;
    }

    const comment = reviewComment.trim();

    if (!comment) {
      await Swal.fire({
        icon: "warning",
        title: "Write your review",
        text: "Please enter a few words about the product.",
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
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setDeletingReviewId(review.id);

    try {
      await deleteReview(review.id);

      const refreshedReviews = await getProductReviews(
        review.product_id
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
      });
    } finally {
      setDeletingReviewId(null);
    }
  }

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
            <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-gray-500" />
            <p className="mt-3 text-gray-500">
              Loading order details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
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
              Unable to display this order.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const orderDelivered = order.status?.toLowerCase() === "delivered";

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

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Order #{order.id}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Placed on {new Date(order.created_at).toLocaleString()}
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
                  order.payment_status?.toLowerCase() === "paid"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                Payment: {formatStatus(order.payment_status)}
              </span>
            </div>
          </div>
        </div>

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

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-700" />
            <h2 className="text-xl font-semibold">
              Products &amp; Reviews
            </h2>
          </div>

          <div className="space-y-6">
            {order.items.map((item) => {
              const productReviews =
                reviewsByProduct[item.product_id] ?? [];

              const myReview = getMyReview(item.product_id);

              const formIsOpen =
                reviewFormProductId === item.product_id;

              const averageRating =
                productReviews.length > 0
                  ? productReviews.reduce(
                      (total, review) => total + review.rating,
                      0
                    ) / productReviews.length
                  : 0;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
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
                      <h3 className="font-semibold text-gray-900">
                        {item.product_name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Product #{item.product_id}
                      </p>
                      <p className="mt-2 text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StarRating
                          rating={Math.round(averageRating)}
                          size="h-4 w-4"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {productReviews.length > 0
                            ? `${averageRating.toFixed(1)} / 5`
                            : "No ratings yet"}
                        </span>

                        {productReviews.length > 0 && (
                          <span className="text-sm text-gray-500">
                            ({productReviews.length}{" "}
                            {productReviews.length === 1
                              ? "review"
                              : "reviews"})
                          </span>
                        )}
                      </div>
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

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">
                          Customer Reviews
                        </h4>
                      </div>

                      {orderDelivered && !myReview && !formIsOpen && (
                        <button
                          type="button"
                          onClick={() =>
                            openCreateReview(item.product_id)
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                        >
                          <Star className="h-4 w-4" />
                          Write a Review
                        </button>
                      )}

                      {orderDelivered && myReview && !formIsOpen && (
                        <button
                          type="button"
                          onClick={() => openEditReview(myReview)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Your Review
                        </button>
                      )}
                    </div>

                    {!orderDelivered && (
                      <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        You can write a review after this order has been
                        delivered.
                      </p>
                    )}

                    {reviewsLoading[item.product_id] ? (
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Loading reviews...
                      </div>
                    ) : productReviews.length === 0 ? (
                      <p className="mt-3 text-sm text-gray-500">
                        No reviews have been submitted for this product yet.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {productReviews.map((review) => {
                          const isMyReview =
                            currentUserId !== null &&
                            String(review.user_id) === currentUserId;

                          return (
                            <div
                              key={review.id}
                              className="rounded-lg bg-gray-50 p-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900">
                                    {isMyReview
                                      ? "Your review"
                                      : review.user_name || "Customer"}
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <StarRating
                                      rating={review.rating}
                                      size="h-4 w-4"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      {review.rating}/5
                                    </span>
                                  </div>
                                </div>

                                <p className="text-xs text-gray-500">
                                  {formatDate(
                                    review.updated_at ||
                                      review.created_at
                                  )}
                                  {review.updated_at &&
                                  review.created_at &&
                                  review.updated_at !== review.created_at
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
                                    onClick={() => openEditReview(review)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleDeleteReview(review)
                                    }
                                    disabled={deletingReviewId !== null}
                                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {deletingReviewId === review.id ? (
                                      <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                    Delete
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
                        className="mt-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="font-semibold text-gray-900">
                              {editingReviewId !== null
                                ? "Edit your review"
                                : "Write a review"}
                            </h5>
                            <p className="mt-1 text-sm text-gray-500">
                              Share your experience with this product.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={closeReviewForm}
                            disabled={savingReview}
                            aria-label="Close review form"
                            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="mt-5">
                          <label className="block text-sm font-medium text-gray-700">
                            Your rating
                          </label>
                          <div className="mt-2 flex items-center gap-3">
                            <StarRating
                              rating={reviewRating}
                              interactive
                              onChange={setReviewRating}
                              size="h-7 w-7"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {reviewRating}/5
                            </span>
                          </div>
                        </div>

                        <div className="mt-5">
                          <label
                            htmlFor={`review-comment-${item.product_id}`}
                            className="block text-sm font-medium text-gray-700"
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
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
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
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingReview && (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
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
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
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
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold">Delivery Address</h2>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-600">
              {order.shipping_address}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold">Payment</h2>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">Payment Status</p>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  order.payment_status?.toLowerCase() === "paid"
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

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-lg font-semibold">Order Total</span>
            <span className="text-2xl font-bold text-gray-900">
              ₹{order.total_amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
