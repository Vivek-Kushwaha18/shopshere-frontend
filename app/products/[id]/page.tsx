"use client";

import { useEffect, useState } from "react";
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

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const productSlug = String(params.id || "");

  const [product, setProduct] =
    useState<Product | null>(null);

  const [relatedProducts, setRelatedProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  const [quantity, setQuantity] =
    useState(1);

  const [addingToCart, setAddingToCart] =
    useState(false);

  const [buyingNow, setBuyingNow] =
    useState(false);

  const [cartMessage, setCartMessage] =
    useState("");

  const [cartError, setCartError] =
    useState("");

  // =====================================================
  // WISHLIST
  // =====================================================

  const [isWishlisted, setIsWishlisted] =
    useState(false);

  const [wishlistLoading, setWishlistLoading] =
    useState(false);

  const [wishlistBusy, setWishlistBusy] =
    useState(false);

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

        const productData =
          await getProduct(productSlug);

        if (!isMounted) {
          return;
        }

        setProduct(productData);
        setQuantity(1);
        setCartMessage("");
        setCartError("");

        // =================================================
        // CHECK WISHLIST
        // =================================================

        try {
          const user = getStoredUser();

          if (user?.role === "customer") {
            setWishlistLoading(true);

            const wishlistStatus =
              await checkWishlist(
                productData.id
              );

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

        const productImages =
          productData.images ?? [];

        const primaryImageIndex =
          productImages.findIndex(
            (image) =>
              image.is_primary
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
          const category =
            await getCategory(
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
        await removeFromWishlist(
          product.id
        );

        setIsWishlisted(false);
      } else {
        await addToWishlist(
          product.id
        );

        setIsWishlisted(true);
      }
    } catch (error) {
      console.error(
        "Wishlist error:",
        error
      );
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

        window.alert(
          "Product link copied."
        );

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

  const images =
    product.images ?? [];

  const currentImage =
    images[selectedImageIndex]
      ?.image_url ?? null;

  const hasDiscount =
    product.original_price != null &&
    product.original_price >
      product.price;

  const discountPercentage =
    hasDiscount &&
    product.original_price
      ? Math.round(
          ((product.original_price -
            product.price) /
            product.original_price) *
            100
        )
      : 0;

  // =====================================================
  // QUANTITY
  // =====================================================

  const handleDecreaseQuantity = () => {
    setQuantity(
      (currentQuantity) =>
        Math.max(
          1,
          currentQuantity - 1
        )
    );
  };

  const handleIncreaseQuantity = () => {
    setQuantity(
      (currentQuantity) =>
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

      const response =
        await addToCart(
          product.id,
          quantity
        );

      if (response.status === 401) {
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

      const response =
        await addToCart(
          product.id,
          quantity
        );

      if (response.status === 401) {
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
        currentIndex ===
        images.length - 1
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

          {/* =================================================
              LEFT IMAGE SECTION
          ================================================= */}

          <div className="border border-gray-200 bg-white">

            <div className="relative overflow-hidden bg-white">

              {/* WISHLIST + SHARE */}

              <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">

                {/* WISHLIST */}

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
                  title={
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

                {/* SHARE */}

                <button
                  type="button"
                  onClick={
                    handleShareProduct
                  }
                  aria-label="Share product"
                  title="Share product"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Share2
                    className="h-5 w-5"
                    strokeWidth={2}
                  />
                </button>

              </div>

              {/* DISCOUNT */}

              {hasDiscount && (
                <div className="absolute left-3 top-3 z-10 bg-red-500 px-2 py-1 text-[11px] font-bold text-white">
                  {discountPercentage}% OFF
                </div>
              )}

              {/* MAIN IMAGE */}

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

              {/* IMAGE NAVIGATION */}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={
                      handlePreviousImage
                    }
                    className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleNextImage
                    }
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

            </div>

            {/* THUMBNAILS */}

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
                        src={
                          image.image_url
                        }
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

          {/* =================================================
              RIGHT SIDE - COMPACT FLIPKART STYLE
          ================================================= */}

          <div className="border border-gray-200 bg-white">

            <div className="p-4 sm:p-5">

              {/* PRODUCT NAME */}

              <div className="border-b border-gray-100 pb-4">

                <h1 className="text-xl font-medium leading-7 text-gray-900 sm:text-2xl">
                  {product.name}
                </h1>

                {/* RATING */}

                {(product.rating != null ||
                  product.reviews_count != null) && (
                  <div className="mt-2 flex items-center gap-2">

                    {product.rating != null && (
                      <span className="inline-flex items-center gap-1 bg-green-600 px-2 py-1 text-xs font-semibold text-white">
                        {product.rating.toFixed(
                          1
                        )}
                        <span>★</span>
                      </span>
                    )}

                    {product.reviews_count != null && (
                      <span className="text-xs text-gray-500">
                        {product.reviews_count}{" "}
                        {product.reviews_count ===
                        1
                          ? "Rating"
                          : "Ratings"}
                      </span>
                    )}

                  </div>
                )}

              </div>

              {/* PRICE */}

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

              {/* STOCK */}

              <div className="border-b border-gray-100 py-4">

                {product.stock > 0 ? (
                  <div>

                    <p className="text-sm font-semibold text-green-600">
                      In Stock
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {product.stock} units available
                    </p>

                  </div>
                ) : (
                  <div>

                    <p className="text-sm font-semibold text-red-600">
                      Out of Stock
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      This product is currently unavailable
                    </p>

                  </div>
                )}

              </div>

              {/* DESCRIPTION */}

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

              {/* QUANTITY */}

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
                        onClick={
                          handleDecreaseQuantity
                        }
                        disabled={
                          quantity <= 1 ||
                          addingToCart ||
                          buyingNow
                        }
                        className="flex h-9 w-9 items-center justify-center text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <span className="flex h-9 min-w-10 items-center justify-center border-x border-gray-300 text-sm font-semibold text-gray-900">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={
                          handleIncreaseQuantity
                        }
                        disabled={
                          quantity >=
                            product.stock ||
                          addingToCart ||
                          buyingNow
                        }
                        className="flex h-9 w-9 items-center justify-center text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Increase quantity"
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

              {/* SUCCESS */}

              {cartMessage && (
                <div className="mt-3 border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                  {cartMessage}
                </div>
              )}

              {/* ERROR */}

              {cartError && (
                <div className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {cartError}
                </div>
              )}

              {/* ACTION BUTTONS */}

              {product.stock > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={
                      handleAddToCart
                    }
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
                    onClick={
                      handleBuyNow
                    }
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

              {/* TRUST INFO */}

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
                              src={
                                relatedImage
                              }
                              alt={
                                item.name
                              }
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