"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Package,
  Plus,
  Share2,
  ShoppingCart,
  Star,
  X,
  Zap,
} from "lucide-react";

import {
  getProduct,
  getProductsByCategory,
  type Product,
} from "@/services/products";

import { getCategory } from "@/services/categories";
import { addToCart } from "@/services/cart";

import {
  addToWishlist,
  checkWishlist,
  removeFromWishlist,
} from "@/services/wishlist";

import { getStoredUser } from "@/services/auth";

import {
  createReview,
  deleteReview,
  getProductReviews,
  updateReview,
  type Review,
} from "@/services/reviews";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const productSlug = String(params.id || "");

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  // =====================================================
  // WISHLIST
  // =====================================================

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  // =====================================================
  // REVIEWS
  // =====================================================

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [editingReviewId, setEditingReviewId] =
    useState<number | null>(null);

  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  const [reviewDeletingId, setReviewDeletingId] =
    useState<number | null>(null);

  const [showReviewsModal, setShowReviewsModal] =
    useState(false);

  // =====================================================
  // CURRENT USER
  // =====================================================

  const currentUser = getStoredUser();

  const isCustomer = currentUser?.role === "customer";

  // =====================================================
  // LOAD REVIEWS
  // =====================================================

  const loadReviews = async (productId: number) => {
    try {
      setReviewsLoading(true);
      setReviewError("");

      const reviewData = await getProductReviews(productId);

      setReviews(reviewData);

      const reviewCount = reviewData.length;

      const averageRating =
        reviewCount > 0
          ? reviewData.reduce(
              (total, review) => total + review.rating,
              0
            ) / reviewCount
          : 0;

      setProduct((currentProduct) => {
        if (!currentProduct) {
          return currentProduct;
        }

        return {
          ...currentProduct,
          rating: averageRating,
          reviews_count: reviewCount,
        };
      });
    } catch (error) {
      console.error("Reviews loading error:", error);

      setReviewError(
        error instanceof Error
          ? error.message
          : "Unable to load reviews."
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  // =====================================================
  // LOAD PRODUCT
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!productSlug.trim()) {
        if (!isMounted) {
          return;
        }

        setError("Invalid product.");
        setLoading(false);

        return;
      }

      try {
        setError("");
        setReviewError("");

        const productData = await getProduct(productSlug);

        if (!isMounted) {
          return;
        }

        setProduct(productData);
        setQuantity(1);
        setCartMessage("");
        setCartError("");

        // =================================================
        // REVIEWS
        // =================================================

        try {
          setReviewsLoading(true);

          const reviewData = await getProductReviews(
            productData.id
          );

          if (!isMounted) {
            return;
          }

          setReviews(reviewData);

          const reviewCount = reviewData.length;

          const averageRating =
            reviewCount > 0
              ? reviewData.reduce(
                  (total, review) =>
                    total + review.rating,
                  0
                ) / reviewCount
              : 0;

          setProduct((currentProduct) => {
            if (!currentProduct) {
              return currentProduct;
            }

            return {
              ...currentProduct,
              rating: averageRating,
              reviews_count: reviewCount,
            };
          });
        } catch (reviewError) {
          console.error(
            "Reviews loading error:",
            reviewError
          );

          if (isMounted) {
            setReviewError(
              reviewError instanceof Error
                ? reviewError.message
                : "Unable to load reviews."
            );
          }
        } finally {
          if (isMounted) {
            setReviewsLoading(false);
          }
        }

        // =================================================
        // CHECK WISHLIST
        // =================================================

        try {
          const user = getStoredUser();

          if (user?.role === "customer") {
            setWishlistLoading(true);

            const wishlistStatus =
              await checkWishlist(productData.id);

            if (!isMounted) {
              return;
            }

            setIsWishlisted(
              wishlistStatus.is_wishlisted
            );
          } else {
            setIsWishlisted(false);
          }
        } catch (wishlistError) {
          console.error(
            "Wishlist check error:",
            wishlistError
          );

          if (isMounted) {
            setIsWishlisted(false);
          }
        } finally {
          if (isMounted) {
            setWishlistLoading(false);
          }
        }

        // =================================================
        // IMAGES
        // =================================================

        const productImages = productData.images ?? [];

        const primaryImageIndex =
          productImages.findIndex(
            (image) => image.is_primary
          );

        setSelectedImageIndex(
          primaryImageIndex >= 0
            ? primaryImageIndex
            : 0
        );

        // =================================================
        // RELATED PRODUCTS
        // =================================================

        try {
          const category = await getCategory(
            productData.category_id
          );

          if (!isMounted) {
            return;
          }

          const categoryProducts =
            await getProductsByCategory(
              category.slug
            );

          if (!isMounted) {
            return;
          }

          setRelatedProducts(
            categoryProducts.filter(
              (item) =>
                item.id !== productData.id
            )
          );
        } catch (relatedError) {
          console.error(
            "Related products error:",
            relatedError
          );

          if (isMounted) {
            setRelatedProducts([]);
          }
        }
      } catch (error) {
        console.error(
          "Product details error:",
          error
        );

        if (!isMounted) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load product."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productSlug]);

  // =====================================================
  // CLOSE MODAL WITH ESCAPE
  // =====================================================

  useEffect(() => {
    if (!showReviewsModal) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowReviewsModal(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [showReviewsModal]);

  // =====================================================
  // WISHLIST
  // =====================================================

  const handleWishlist = async () => {
    if (!product) {
      return;
    }

    const user = getStoredUser();

    if (user?.role !== "customer") {
      router.push("/login");
      return;
    }

    try {
      setWishlistBusy(true);

      if (isWishlisted) {
        await removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await addToWishlist(product.id);
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error("Wishlist error:", error);
    } finally {
      setWishlistBusy(false);
    }
  };

  // =====================================================
  // SHARE PRODUCT
  // =====================================================

  const handleShareProduct = async () => {
    if (!product) {
      return;
    }

    const productUrl =
      `${window.location.origin}/products/${product.slug}`;

    try {
      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: productUrl,
        });

        return;
      }

      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText ===
          "function"
      ) {
        await navigator.clipboard.writeText(
          productUrl
        );

        window.alert("Product link copied.");

        return;
      }

      window.prompt(
        "Copy this product link:",
        productUrl
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "Share product error:",
        error
      );
    }
  };

  // =====================================================
  // REVIEW SUBMIT
  // =====================================================

  const handleSubmitReview = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!product) {
      return;
    }

    const user = getStoredUser();

    if (user?.role !== "customer") {
      router.push("/login");
      return;
    }

    const trimmedComment =
      reviewComment.trim();

    if (!trimmedComment) {
      setReviewError(
        "Please write a review."
      );

      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");

      await createReview({
        product_id: product.id,
        rating: reviewRating,
        comment: trimmedComment,
      });

      setReviewComment("");
      setReviewRating(5);

      await loadReviews(product.id);
    } catch (error) {
      console.error(
        "Create review error:",
        error
      );

      setReviewError(
        error instanceof Error
          ? error.message
          : "Unable to submit review."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  // =====================================================
  // START EDIT REVIEW
  // =====================================================

  const handleStartEditReview = (
    review: Review
  ) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setReviewError("");
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment("");
    setReviewError("");
  };

  // =====================================================
  // UPDATE REVIEW
  // =====================================================

  const handleUpdateReview = async (
    reviewId: number
  ) => {
    if (!product) {
      return;
    }

    const trimmedComment =
      editComment.trim();

    if (!trimmedComment) {
      setReviewError(
        "Please write a review."
      );

      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");

      await updateReview(
        reviewId,
        {
          rating: editRating,
          comment: trimmedComment,
        }
      );

      handleCancelEditReview();

      await loadReviews(product.id);
    } catch (error) {
      console.error(
        "Update review error:",
        error
      );

      setReviewError(
        error instanceof Error
          ? error.message
          : "Unable to update review."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  // =====================================================
  // DELETE REVIEW
  // =====================================================

  const handleDeleteReview = async (
    reviewId: number
  ) => {
    if (!product) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setReviewDeletingId(reviewId);
      setReviewError("");

      await deleteReview(reviewId);

      if (editingReviewId === reviewId) {
        handleCancelEditReview();
      }

      await loadReviews(product.id);
    } catch (error) {
      console.error(
        "Delete review error:",
        error
      );

      setReviewError(
        error instanceof Error
          ? error.message
          : "Unable to delete review."
      );
    } finally {
      setReviewDeletingId(null);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-3 py-5 sm:px-5">
          <div className="mb-4 h-4 w-28 animate-pulse rounded bg-gray-200" />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border border-gray-200 bg-white p-3">
              <div className="aspect-square animate-pulse bg-gray-100" />
            </div>

            <div className="border border-gray-200 bg-white p-5">
              <div className="space-y-4">
                <div className="h-6 w-4/5 animate-pulse rounded bg-gray-100" />
                <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
                <div className="h-8 w-36 animate-pulse rounded bg-gray-100" />
                <div className="h-16 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-3 py-8 sm:px-5">
          <div className="border border-red-200 bg-white p-6">
            <div className="bg-red-50 p-4 text-red-700">
              <h1 className="text-lg font-semibold">
                Unable to load product
              </h1>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>

            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  // =====================================================
  // PRODUCT DATA
  // =====================================================

  const images = product.images ?? [];

  const currentImage =
    images[selectedImageIndex]?.image_url ?? null;

  const hasDiscount =
    product.original_price != null &&
    product.original_price > product.price;

  const discountPercentage =
    hasDiscount && product.original_price
      ? Math.round(
          ((product.original_price -
            product.price) /
            product.original_price) *
            100
        )
      : 0;

  // =====================================================
  // REVIEW STATISTICS
  // =====================================================

  const reviewCount = reviews.length;

  const averageRating =
    reviewCount > 0
      ? reviews.reduce(
          (total, review) =>
            total + review.rating,
          0
        ) / reviewCount
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(
    (rating) => {
      const count = reviews.filter(
        (review) =>
          review.rating === rating
      ).length;

      const percentage =
        reviewCount > 0
          ? Math.round(
              (count / reviewCount) * 100
            )
          : 0;

      return {
        rating,
        count,
        percentage,
      };
    }
  );

  // =====================================================
  // QUANTITY
  // =====================================================

  const handleDecreaseQuantity = () => {
    setQuantity((currentQuantity) =>
      Math.max(1, currentQuantity - 1)
    );
  };

  const handleIncreaseQuantity = () => {
    setQuantity((currentQuantity) =>
      Math.min(
        product.stock,
        currentQuantity + 1
      )
    );
  };

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = async () => {
    if (product.stock <= 0) {
      setCartError(
        "This product is out of stock."
      );

      return;
    }

    if (quantity > product.stock) {
      setCartError(
        `Only ${product.stock} items are available.`
      );

      return;
    }

    try {
      setAddingToCart(true);
      setCartMessage("");
      setCartError("");

      const response = await addToCart(
        product.id,
        quantity
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.success) {
        const message =
          response.data?.detail ||
          "Unable to add product to cart.";

        throw new Error(message);
      }

      setCartMessage(
        `${quantity} ${
          quantity === 1
            ? "item"
            : "items"
        } added to cart.`
      );

      setTimeout(() => {
        setCartMessage("");
      }, 1000);
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      setCartError(
        error instanceof Error
          ? error.message
          : "Unable to add product to cart."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  // =====================================================
  // BUY NOW
  // =====================================================

  const handleBuyNow = async () => {
    if (product.stock <= 0) {
      setCartError(
        "This product is out of stock."
      );

      return;
    }

    if (quantity > product.stock) {
      setCartError(
        `Only ${product.stock} items are available.`
      );

      return;
    }

    try {
      setBuyingNow(true);
      setCartMessage("");
      setCartError("");

      const response = await addToCart(
        product.id,
        quantity
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.success) {
        const message =
          response.data?.detail ||
          "Unable to proceed.";

        throw new Error(message);
      }

      router.push("/cart");
    } catch (error) {
      console.error(
        "Buy now error:",
        error
      );

      setCartError(
        error instanceof Error
          ? error.message
          : "Unable to proceed to cart."
      );
    } finally {
      setBuyingNow(false);
    }
  };

  // =====================================================
  // IMAGE NAVIGATION
  // =====================================================

  const handleNextImage = () => {
    if (images.length <= 1) {
      return;
    }

    setSelectedImageIndex(
      (currentIndex) =>
        currentIndex === images.length - 1
          ? 0
          : currentIndex + 1
    );
  };

  const handlePreviousImage = () => {
    if (images.length <= 1) {
      return;
    }

    setSelectedImageIndex(
      (currentIndex) =>
        currentIndex === 0
          ? images.length - 1
          : currentIndex - 1
    );
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-5">

        {/* BACK */}

        <Link
          href="/products"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Products
        </Link>

        {/* =================================================
            MAIN PRODUCT SECTION
        ================================================= */}

        <section className="grid gap-4 lg:grid-cols-2">

          {/* IMAGE */}

          <div className="border border-gray-200 bg-white">
            <div className="relative overflow-hidden bg-white">

              <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">

                <button
                  type="button"
                  onClick={handleWishlist}
                  disabled={
                    wishlistLoading ||
                    wishlistBusy
                  }
                  aria-label={
                    isWishlisted
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                  className={`flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition ${
                    isWishlisted
                      ? "border-red-100 text-red-500"
                      : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isWishlisted
                        ? "fill-red-500 text-red-500"
                        : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleShareProduct}
                  aria-label="Share product"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Share2 className="h-5 w-5" />
                </button>

              </div>

              {hasDiscount && (
                <div className="absolute left-3 top-3 z-10 bg-red-500 px-2 py-1 text-[11px] font-bold text-white">
                  {discountPercentage}% OFF
                </div>
              )}

              <div className="aspect-square">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="h-full w-full object-contain p-2 sm:p-4"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePreviousImage}
                    className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-gray-100 p-3">
                {images.map(
                  (image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() =>
                        setSelectedImageIndex(
                          index
                        )
                      }
                      className={`h-14 w-14 shrink-0 overflow-hidden border-2 bg-gray-50 ${
                        selectedImageIndex ===
                        index
                          ? "border-gray-900"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={`${product.name} ${
                          index + 1
                        }`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* PRODUCT INFORMATION */}

          <div className="border border-gray-200 bg-white">
            <div className="p-4 sm:p-5">

              <div className="border-b border-gray-100 pb-4">

                <h1 className="text-xl font-medium leading-7 text-gray-900 sm:text-2xl">
                  {product.name}
                </h1>

                <div className="mt-2 flex items-center gap-2">

                  <span className="inline-flex items-center gap-1 bg-green-600 px-2 py-1 text-xs font-semibold text-white">
                    {(product.rating ?? 0).toFixed(1)}
                    <span>★</span>
                  </span>

                  <span className="text-xs text-gray-500">
                    {product.reviews_count ?? 0}{" "}
                    {(product.reviews_count ?? 0) ===
                    1
                      ? "Rating"
                      : "Ratings"}
                  </span>

                </div>
              </div>

              <div className="border-b border-gray-100 py-4">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="text-3xl font-semibold text-gray-900">
                    ₹
                    {product.price.toLocaleString(
                      "en-IN"
                    )}
                  </span>

                  {hasDiscount && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹
                      {product.original_price!.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  )}

                  {hasDiscount && (
                    <span className="text-sm font-semibold text-green-600">
                      {discountPercentage}% off
                    </span>
                  )}

                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Inclusive of all taxes
                </p>
              </div>

              <div className="border-b border-gray-100 py-4">

                {product.stock > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-green-600">
                      In Stock
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {product.stock} units available
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-red-600">
                      Out of Stock
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      This product is currently unavailable
                    </p>
                  </>
                )}

              </div>

              {product.description && (
                <div className="border-b border-gray-100 py-4">

                  <h2 className="text-sm font-semibold text-gray-900">
                    Product Description
                  </h2>

                  <p className="mt-2 whitespace-pre-line text-sm leading-5 text-gray-600">
                    {product.description}
                  </p>

                </div>
              )}

              {product.stock > 0 && (
                <div className="border-b border-gray-100 py-4">

                  <div className="flex items-center justify-between">

                    <p className="text-sm font-semibold text-gray-900">
                      Quantity
                    </p>

                    <span className="text-xs text-gray-400">
                      Max {product.stock}
                    </span>

                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">

                    <div className="inline-flex items-center border border-gray-300">

                      <button
                        type="button"
                        onClick={handleDecreaseQuantity}
                        disabled={
                          quantity <= 1 ||
                          addingToCart ||
                          buyingNow
                        }
                        className="flex h-9 w-9 items-center justify-center text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <span className="flex h-9 min-w-10 items-center justify-center border-x border-gray-300 text-sm font-semibold text-gray-900">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={handleIncreaseQuantity}
                        disabled={
                          quantity >=
                            product.stock ||
                          addingToCart ||
                          buyingNow
                        }
                        className="flex h-9 w-9 items-center justify-center text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>

                    </div>

                    <span className="text-sm text-gray-500">
                      Total:{" "}
                      <strong className="text-gray-900">
                        ₹
                        {(
                          product.price *
                          quantity
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </span>

                  </div>
                </div>
              )}

              {cartMessage && (
                <div className="mt-3 border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                  {cartMessage}
                </div>
              )}

              {cartError && (
                <div className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {cartError}
                </div>
              )}

              {product.stock > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={
                      addingToCart ||
                      buyingNow
                    }
                    className="flex h-11 items-center justify-center gap-2 bg-orange-500 px-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingCart className="h-4 w-4" />

                    {addingToCart
                      ? "Adding..."
                      : "Add to Cart"}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={
                      addingToCart ||
                      buyingNow
                    }
                    className="flex h-11 items-center justify-center gap-2 bg-yellow-500 px-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />

                    {buyingNow
                      ? "Processing..."
                      : "Buy Now"}
                  </button>

                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-4">

                <span className="text-xs text-gray-500">
                  ✓ Secure Payment
                </span>

                <span className="text-xs text-gray-500">
                  ✓ Quality Products
                </span>

                <span className="text-xs text-gray-500">
                  ✓ Easy Shopping
                </span>

              </div>

            </div>
          </div>

        </section>

        {/* =================================================
            COMPACT RATINGS & REVIEWS
        ================================================= */}

        <section className="mt-6">
          <div className="w-fit rounded-md border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() =>
                setShowReviewsModal(true)
              }
              className="group flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <span className="font-medium">
                Ratings & Reviews
              </span>

              <span className="inline-flex items-center gap-0.5 text-gray-500">
                {(product.rating ?? 0).toFixed(1)}

                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </span>

              <span className="text-gray-400">
                ({reviewCount})
              </span>

              <ChevronRight className="h-3 w-3 text-gray-400 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>

        {/* =================================================
            REVIEWS MODAL
        ================================================= */}

        {showReviewsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reviews-modal-title"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowReviewsModal(false);
              }
            }}
          >
            <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-lg">

              {/* MODAL HEADER */}

              <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">

                <div>
                  <h2
                    id="reviews-modal-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Ratings & Reviews
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {reviewCount}{" "}
                    {reviewCount === 1
                      ? "customer review"
                      : "customer reviews"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowReviewsModal(false)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Close reviews"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>

              {/* MODAL BODY */}

              <div className="flex-1 overflow-y-auto">

                {/* REVIEW SUMMARY */}

                <div className="grid border-b border-gray-200 sm:grid-cols-[190px_1fr]">

                  {/* AVERAGE */}

                  <div className="border-b border-gray-200 px-4 py-5 text-center sm:border-b-0 sm:border-r">

                    <div className="text-4xl font-bold text-gray-900">
                      {averageRating.toFixed(1)}
                    </div>

                    <div className="mt-2 flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <=
                              Math.round(
                                averageRating
                              )
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        )
                      )}
                    </div>

                    <p className="mt-1.5 text-[11px] text-gray-500">
                      Based on {reviewCount}{" "}
                      {reviewCount === 1
                        ? "review"
                        : "reviews"}
                    </p>

                  </div>

                  {/* RATING BREAKDOWN */}

                  <div className="px-4 py-5 sm:px-6">

                    <div className="space-y-2.5">

                      {ratingDistribution.map(
                        (item) => (
                          <div
                            key={item.rating}
                            className="flex items-center gap-2"
                          >
                            <span className="w-7 text-[11px] font-medium text-gray-600">
                              {item.rating} ★
                            </span>

                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-yellow-400 transition-all"
                                style={{
                                  width: `${item.percentage}%`,
                                }}
                              />
                            </div>

                            <span className="w-7 text-right text-[11px] text-gray-400">
                              {item.count}
                            </span>
                          </div>
                        )
                      )}

                    </div>

                  </div>

                </div>

                {/* WRITE REVIEW */}

                {isCustomer && (
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">

                    <form
                      onSubmit={
                        handleSubmitReview
                      }
                      className="max-w-2xl"
                    >

                      <div className="flex flex-wrap items-center justify-between gap-3">

                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            Write a review
                          </h3>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Share your experience with this product.
                          </p>
                        </div>

                        <div className="flex items-center gap-1">

                          {[1, 2, 3, 4, 5].map(
                            (star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  setReviewRating(
                                    star
                                  )
                                }
                                className="p-0.5"
                                aria-label={`Rate ${star} out of 5`}
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    star <=
                                    reviewRating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            )
                          )}

                          <span className="ml-1 text-xs font-medium text-gray-500">
                            {reviewRating}/5
                          </span>

                        </div>

                      </div>

                      <textarea
                        value={reviewComment}
                        onChange={(event) =>
                          setReviewComment(
                            event.target.value
                          )
                        }
                        rows={3}
                        maxLength={2000}
                        placeholder="Write your review..."
                        className="mt-3 w-full resize-none border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-500"
                      />

                      <div className="mt-2 flex items-center justify-between">

                        <span className="text-[11px] text-gray-400">
                          {reviewComment.length}/2000
                        </span>

                        <button
                          type="submit"
                          disabled={
                            reviewSubmitting
                          }
                          className="bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {reviewSubmitting
                            ? "Submitting..."
                            : "Submit Review"}
                        </button>

                      </div>

                    </form>

                  </div>
                )}

                {/* REVIEW ERROR */}

                {reviewError && (
                  <div className="mx-4 mt-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:mx-6">
                    {reviewError}
                  </div>
                )}

                {/* CUSTOMER REVIEWS */}

                <div className="px-4 py-5 sm:px-6">

                  <div className="mb-4 flex items-center justify-between">

                    <h3 className="text-sm font-semibold text-gray-900">
                      Customer Reviews
                    </h3>

                    {reviewCount > 0 && (
                      <span className="text-[11px] text-gray-400">
                        Newest first
                      </span>
                    )}

                  </div>

                  {/* LOADING */}

                  {reviewsLoading ? (
                    <div className="space-y-5">

                      {[1, 2, 3].map(
                        (item) => (
                          <div
                            key={item}
                            className="animate-pulse border-b border-gray-100 pb-5"
                          >
                            <div className="flex gap-3">

                              <div className="h-9 w-9 rounded-full bg-gray-100" />

                              <div className="flex-1">

                                <div className="h-3 w-28 rounded bg-gray-100" />

                                <div className="mt-2 h-3 w-20 rounded bg-gray-100" />

                                <div className="mt-4 h-3 w-full rounded bg-gray-100" />

                                <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />

                              </div>

                            </div>
                          </div>
                        )
                      )}

                    </div>
                  ) : reviews.length === 0 ? (

                    /* NO REVIEWS */

                    <div className="py-10 text-center">

                      <Star className="mx-auto h-9 w-9 text-gray-300" />

                      <p className="mt-3 text-sm font-semibold text-gray-800">
                        No reviews yet
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Be the first customer to review this product.
                      </p>

                    </div>

                  ) : (

                    /* REVIEW LIST */

                    <div className="space-y-5">

                      {reviews.map(
                        (review) => {

                          const isOwnReview =
                            String(
                              currentUser?.id
                            ) ===
                            String(
                              review.user_id
                            );

                          const isEditing =
                            editingReviewId ===
                            review.id;

                          const reviewerName =
                            review.user_name?.trim() ||
                            "Customer";

                          const reviewerInitial =
                            reviewerName
                              .charAt(0)
                              .toUpperCase();

                          return (
                            <article
                              key={review.id}
                              className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0"
                            >

                              {/* REVIEW HEADER */}

                              <div className="flex items-start justify-between gap-3">

                                <div className="flex min-w-0 items-start gap-3">

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                                    {reviewerInitial}
                                  </div>

                                  <div className="min-w-0">

                                    <div className="flex flex-wrap items-center gap-2">

                                      <span className="truncate text-sm font-semibold text-gray-900">
                                        {reviewerName}
                                      </span>

                                      <span className="text-[10px] text-gray-400">
                                        {new Date(
                                          review.created_at
                                        ).toLocaleDateString(
                                          "en-IN",
                                          {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          }
                                        )}
                                      </span>

                                    </div>

                                    <div className="mt-1 flex items-center gap-2">

                                      <div className="flex items-center">

                                        {[1, 2, 3, 4, 5].map(
                                          (star) => (
                                            <Star
                                              key={star}
                                              className={`h-3.5 w-3.5 ${
                                                star <=
                                                review.rating
                                                  ? "fill-yellow-400 text-yellow-400"
                                                  : "text-gray-300"
                                              }`}
                                            />
                                          )
                                        )}

                                      </div>

                                      <span className="text-[10px] text-gray-400">
                                        {review.rating}/5
                                      </span>

                                    </div>

                                  </div>

                                </div>

                                {/* ACTIONS */}

                                {(isOwnReview ||
                                  currentUser?.role ===
                                    "admin") && (
                                  <div className="flex shrink-0 items-center gap-3">

                                    {isOwnReview && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStartEditReview(
                                            review
                                          )
                                        }
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                                      >
                                        Edit
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteReview(
                                          review.id
                                        )
                                      }
                                      disabled={
                                        reviewDeletingId ===
                                        review.id
                                      }
                                      className="text-[11px] font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                                    >
                                      {reviewDeletingId ===
                                      review.id
                                        ? "Deleting..."
                                        : "Delete"}
                                    </button>

                                  </div>
                                )}

                              </div>

                              {/* EDIT REVIEW */}

                              {isEditing ? (

                                <div className="mt-4 ml-12 rounded border border-gray-200 bg-gray-50 p-3">

                                  <p className="text-xs font-semibold text-gray-700">
                                    Edit your review
                                  </p>

                                  <div className="mt-2 flex items-center">

                                    {[1, 2, 3, 4, 5].map(
                                      (star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() =>
                                            setEditRating(
                                              star
                                            )
                                          }
                                          className="p-1"
                                          aria-label={`Set rating to ${star}`}
                                        >
                                          <Star
                                            className={`h-4 w-4 ${
                                              star <=
                                              editRating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        </button>
                                      )
                                    )}

                                  </div>

                                  <textarea
                                    value={
                                      editComment
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setEditComment(
                                        event.target
                                          .value
                                      )
                                    }
                                    rows={3}
                                    maxLength={2000}
                                    className="mt-2 w-full resize-none border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
                                  />

                                  <div className="mt-2 flex justify-end gap-2">

                                    <button
                                      type="button"
                                      onClick={
                                        handleCancelEditReview
                                      }
                                      disabled={
                                        reviewSubmitting
                                      }
                                      className="border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateReview(
                                          review.id
                                        )
                                      }
                                      disabled={
                                        reviewSubmitting
                                      }
                                      className="bg-gray-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                      {reviewSubmitting
                                        ? "Saving..."
                                        : "Save"}
                                    </button>

                                  </div>

                                </div>

                              ) : (

                                /* REVIEW COMMENT */

                                <p className="mt-3 ml-12 whitespace-pre-line text-sm leading-5 text-gray-600">
                                  {review.comment}
                                </p>

                              )}

                            </article>
                          );
                        }
                      )}

                    </div>
                  )}

                </div>

              </div>
            </div>
          </div>
        )}

        {/* =================================================
            RELATED PRODUCTS
        ================================================= */}

        {relatedProducts.length > 0 && (
          <section className="mt-8">

            <div className="mb-4 border-b border-gray-200 pb-3">

              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                More Products From This Category
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Explore similar products you may like.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

              {relatedProducts.map(
                (item) => {

                  const relatedImages =
                    item.images ?? [];

                  const relatedImage =
                    relatedImages.find(
                      (image) =>
                        image.is_primary
                    )?.image_url ||
                    relatedImages[0]
                      ?.image_url ||
                    item.image ||
                    null;

                  const itemHasDiscount =
                    item.original_price !=
                      null &&
                    item.original_price >
                      item.price;

                  const itemDiscount =
                    itemHasDiscount &&
                    item.original_price
                      ? Math.round(
                          ((item.original_price -
                            item.price) /
                            item.original_price) *
                            100
                        )
                      : 0;

                  return (
                    <Link
                      key={item.id}
                      href={`/products/${item.slug}`}
                      className="group block"
                    >

                      <article className="overflow-hidden border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-md">

                        <div className="relative aspect-square overflow-hidden bg-gray-50">

                          {relatedImage ? (
                            <img
                              src={relatedImage}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-10 w-10 text-gray-300" />
                            </div>
                          )}

                          {itemHasDiscount && (
                            <span className="absolute left-2 top-2 bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              {itemDiscount}% OFF
                            </span>
                          )}

                        </div>

                        <div className="p-3">

                          <h3 className="line-clamp-2 min-h-[40px] text-sm font-medium leading-5 text-gray-900">
                            {item.name}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-2">

                            <p className="text-base font-semibold text-gray-900">
                              ₹
                              {item.price.toLocaleString(
                                "en-IN"
                              )}
                            </p>

                            {itemHasDiscount && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹
                                {item.original_price!.toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            )}

                          </div>

                          <div className="mt-1">

                            {item.stock > 0 ? (
                              <span className="text-[11px] font-medium text-green-600">
                                In stock
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-red-600">
                                Out of stock
                              </span>
                            )}

                          </div>

                        </div>

                      </article>

                    </Link>
                  );
                }
              )}

            </div>

          </section>
        )}

      </div>
    </main>
  );
}