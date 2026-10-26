"use client";

import { useCallback, useEffect, useState } from "react";
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
  Star,
} from "lucide-react";

import {
  getProduct,
  getProductsByCategory,
  type Product,
  type ProductOptionGroup,
  type ProductVariant,
  type ProductImage,
} from "@/services/products";

import { getCategory } from "@/services/categories";
import { addToCart, getCart } from "@/services/cart";

import {
  addToWishlist,
  checkWishlist,
  removeFromWishlist,
} from "@/services/wishlist";

import { getStoredUser } from "@/services/auth";
import { recordViewedProduct } from "@/services/recently-viewed";

const BUY_NOW_STORAGE_KEY = "shopsphere-buy-now-checkout";

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
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, number>
  >({});

  const [addingToCart, setAddingToCart] = useState(false);
  const [isProductInCart, setIsProductInCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  // LOAD PRODUCT

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!productSlug.trim()) {
        if (isMounted) {
          setError("Invalid product.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const productData = await getProduct(productSlug);

        if (!isMounted) return;

        setProduct(productData);
        recordViewedProduct(productData.id);
        setQuantity(1);

        const activeVariants = (productData.variants ?? []).filter(
          (variant) => variant.is_active
        );

        const defaultVariant = activeVariants[0] ?? null;
        const defaultOptions: Record<number, number> = {};

        if (defaultVariant) {
          (productData.option_groups ?? []).forEach((group) => {
            const defaultValue = group.values.find((value) =>
              defaultVariant.option_value_ids.includes(value.id)
            );

            if (defaultValue) {
              defaultOptions[group.id] = defaultValue.id;
            }
          });
        }

        setSelectedOptions(defaultOptions);
        setSelectedImageIndex(0);
        setIsProductInCart(false);
        setCartMessage("");
        setCartError("");

        // CHECK WISHLIST

        try {
          const user = getStoredUser();

          if (user?.role === "customer") {
            setWishlistLoading(true);

            const wishlistStatus = await checkWishlist(productData.id);

            if (!isMounted) return;

            setIsWishlisted(wishlistStatus.is_wishlisted);
          } else {
            setIsWishlisted(false);
          }
        } catch (wishlistError) {
          console.error("Wishlist check error:", wishlistError);

          if (isMounted) {
            setIsWishlisted(false);
          }
        } finally {
          if (isMounted) {
            setWishlistLoading(false);
          }
        }

        // INITIAL PRODUCT IMAGE

        const productImages = productData.images ?? [];

        const primaryImageIndex = productImages.findIndex(
          (image) => image.is_primary && image.variant_id == null
        );

        if (isMounted) {
          setSelectedImageIndex(
            primaryImageIndex >= 0 ? primaryImageIndex : 0
          );
        }

        // RELATED PRODUCTS

        try {
          const category = await getCategory(productData.category_id);

          if (!isMounted) return;

          const categoryProducts = await getProductsByCategory(category.slug);

          if (!isMounted) return;

          setRelatedProducts(
            categoryProducts.filter(
              (item) => Number(item.id) !== Number(productData.id)
            )
          );
        } catch (relatedError) {
          console.error("Related products error:", relatedError);

          if (isMounted) {
            setRelatedProducts([]);
          }
        }
      } catch (loadError) {
        console.error("Product details error:", loadError);

        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load product."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productSlug]);

  // REFRESH RATING WHEN RETURNING TO THE PAGE

  useEffect(() => {
    let isMounted = true;
    let isRefreshing = false;

    async function refreshProductRating() {
      if (!productSlug.trim() || isRefreshing) return;

      isRefreshing = true;

      try {
        const latestProduct = await getProduct(productSlug);

        if (!isMounted) return;

        setProduct((currentProduct) => {
          if (
            !currentProduct ||
            Number(currentProduct.id) !== Number(latestProduct.id)
          ) {
            return currentProduct;
          }

          return {
            ...currentProduct,
            rating: latestProduct.rating,
            reviews_count: latestProduct.reviews_count,
          };
        });
      } catch (refreshError) {
        console.error("Product rating refresh error:", refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshProductRating();
      }
    }

    window.addEventListener("focus", refreshProductRating);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", refreshProductRating);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [productSlug]);

  // CHECK WHETHER PRODUCT IS ALREADY IN CART

  useEffect(() => {
    let isMounted = true;

    async function checkProductInCart() {
      if (!product) return;

      const user = getStoredUser();

      if (user?.role !== "customer") {
        setIsProductInCart(false);
        return;
      }

      try {
        const cart = await getCart();

        if (!isMounted) return;

        const alreadyInCart =
          Array.isArray(cart.items) &&
          cart.items.some(
            (item) => Number(item.product_id) === Number(product.id)
          );

        setIsProductInCart(alreadyInCart);
      } catch (cartCheckError) {
        console.error("Product cart check error:", cartCheckError);

        if (isMounted) {
          setIsProductInCart(false);
        }
      }
    }

    void checkProductInCart();

    return () => {
      isMounted = false;
    };
  }, [product?.id]);

  // WISHLIST

  const handleWishlist = async () => {
    if (!product) return;

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
    } catch (wishlistError) {
      console.error("Wishlist error:", wishlistError);
      setCartError("Unable to update your wishlist. Please try again.");
    } finally {
      setWishlistBusy(false);
    }
  };

  // SHARE PRODUCT

  const handleShareProduct = async () => {
    if (!product) return;

    const productUrl = `${window.location.origin}/products/${product.slug || product.id}`;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: productUrl,
        });
        return;
      }

      if (typeof navigator.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(productUrl);
        window.alert("Product link copied.");
        return;
      }

      window.prompt("Copy this product link:", productUrl);
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return;
      }

      console.error("Share product error:", shareError);
    }
  };

  // LOADING STATE

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

  // ERROR STATE

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-3 py-8 sm:px-5">
          <div className="border border-red-200 bg-white p-6">
            <div className="bg-red-50 p-4 text-red-700">
              <h1 className="text-lg font-semibold">Unable to load product</h1>
              <p className="mt-1 text-sm">{error}</p>
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

  if (!product) return null;

  // PRODUCT OPTIONS AND VARIANTS

  const optionGroups = product.option_groups ?? [];

  const variants = (product.variants ?? []).filter(
    (variant) => variant.is_active
  );

  const hasVariants = optionGroups.length > 0 && variants.length > 0;

  const allRequiredOptionsSelected =
    hasVariants &&
    optionGroups.every(
      (group) => selectedOptions[group.id] !== undefined
    );

  const selectedValueIds = Object.values(selectedOptions);

  const selectedVariant: ProductVariant | null =
    hasVariants && allRequiredOptionsSelected
      ? variants.find((variant) => {
          const variantValueIds = variant.option_value_ids;

          return (
            variantValueIds.length === optionGroups.length &&
            selectedValueIds.length === optionGroups.length &&
            variantValueIds.every((id) => selectedValueIds.includes(id)) &&
            selectedValueIds.every((id) => variantValueIds.includes(id))
          );
        }) ?? null
      : null;

  // OPTION AVAILABILITY

  const isOptionValueAvailable = (
    groupId: number,
    valueId: number
  ) => {
    if (!hasVariants) return true;

    const candidateSelections = {
      ...selectedOptions,
      [groupId]: valueId,
    };

    const selectedEntries = Object.entries(candidateSelections).map(
      ([selectedGroupId, selectedValueId]) =>
        [Number(selectedGroupId), selectedValueId] as [number, number]
    );

    return variants.some((variant) => {
      if (variant.option_value_ids.length !== optionGroups.length) {
        return false;
      }

      return selectedEntries.every(([, selectedValueId]) =>
        variant.option_value_ids.includes(selectedValueId)
      );
    });
  };

  // PRICE AND STOCK

  const currentPrice = Number(selectedVariant?.price ?? product.price);

  const currentOriginalPrice =
    selectedVariant?.original_price ?? product.original_price;

  const currentStock = Number(selectedVariant?.stock ?? product.stock ?? 0);

  // PRODUCT IMAGE GALLERY

  const productImages = product.images ?? [];

  const selectedOptionEntries = Object.entries(selectedOptions).map(
    ([groupId, valueId]) =>
      [Number(groupId), valueId] as [number, number]
  );

  const matchingVariants = hasVariants
    ? variants.filter((variant) =>
        selectedOptionEntries.every(([, valueId]) =>
          variant.option_value_ids.includes(valueId)
        )
      )
    : [];

  let galleryImages: ProductImage[] = [];

  if (
    selectedVariant?.images &&
    selectedVariant.images.length > 0
  ) {
    galleryImages = [...selectedVariant.images].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  if (
    galleryImages.length === 0 &&
    selectedOptionEntries.length > 0 &&
    matchingVariants.length > 0
  ) {
    const uniqueImages = new Map<number, ProductImage>();

    matchingVariants
      .flatMap((variant) => variant.images ?? [])
      .forEach((image) => {
        if (!uniqueImages.has(image.id)) {
          uniqueImages.set(image.id, image);
        }
      });

    galleryImages = [...uniqueImages.values()].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  if (
    galleryImages.length === 0 &&
    selectedOptionEntries.length === 0
  ) {
    galleryImages = productImages
      .filter((image) => image.variant_id == null)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  if (
    galleryImages.length === 0 &&
    selectedOptionEntries.length === 0 &&
    hasVariants
  ) {
    const uniqueImages = new Map<number, ProductImage>();

    variants
      .flatMap((variant) => variant.images ?? [])
      .forEach((image) => {
        if (!uniqueImages.has(image.id)) {
          uniqueImages.set(image.id, image);
        }
      });

    galleryImages = [...uniqueImages.values()].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  if (galleryImages.length === 0) {
    galleryImages = [...productImages].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  const images = galleryImages;

  const safeImageIndex =
    images.length > 0
      ? Math.min(selectedImageIndex, images.length - 1)
      : 0;

  const currentImage = images[safeImageIndex]?.image_url ?? null;

  // DISCOUNT

  const hasDiscount =
    currentOriginalPrice != null &&
    Number(currentOriginalPrice) > currentPrice;

  const discountPercentage =
    hasDiscount && Number(currentOriginalPrice) > 0
      ? Math.round(
          ((Number(currentOriginalPrice) - currentPrice) /
            Number(currentOriginalPrice)) *
            100
        )
      : 0;

  // READ-ONLY RATINGS

  const productRating = Math.min(
    5,
    Math.max(0, Number(product.rating ?? 0))
  );

  const productReviewsCount = Math.max(
    0,
    Number(product.reviews_count ?? 0)
  );

  // OPTION SELECTION

  const handleOptionSelect = (
    group: ProductOptionGroup,
    valueId: number
  ) => {
    if (!isOptionValueAvailable(group.id, valueId)) return;

    setSelectedOptions((current) => ({
      ...current,
      [group.id]: valueId,
    }));

    setQuantity(1);
    setSelectedImageIndex(0);
    setCartMessage("");
    setCartError("");
  };

  // QUANTITY

  const handleDecreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const handleIncreaseQuantity = () => {
    setQuantity((current) => Math.min(currentStock, current + 1));
  };

  // VALIDATE PRODUCT BEFORE CART OR BUY NOW

  const validateSelection = () => {
    if (hasVariants && (!allRequiredOptionsSelected || !selectedVariant)) {
      setCartError(
        allRequiredOptionsSelected
          ? "This variant is not available."
          : "Please select all product options."
      );
      return false;
    }

    if (currentStock <= 0) {
      setCartError("This product is out of stock.");
      return false;
    }

    if (quantity > currentStock) {
      setCartError(`Only ${currentStock} items are available.`);
      return false;
    }

    if (!Number.isFinite(currentPrice) || currentPrice < 0) {
      setCartError("The product price is invalid.");
      return false;
    }

    return true;
  };

  // ADD TO CART
  // This adds the item to the customer's normal cart.

  const handleAddToCart = async () => {
    if (!validateSelection()) return;

    try {
      setAddingToCart(true);
      setCartMessage("");
      setCartError("");

      const response = await addToCart(
        product.id,
        quantity,
        selectedVariant?.id ?? null
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.success) {
        throw new Error(
          response.data?.detail || "Unable to add product to cart."
        );
      }

      setIsProductInCart(true);

      setCartMessage(
        `${quantity} ${quantity === 1 ? "item" : "items"} added to cart.`
      );

      window.setTimeout(() => {
        setCartMessage("");
      }, 3000);
    } catch (addError) {
      console.error("Add to cart error:", addError);

      setCartError(
        addError instanceof Error
          ? addError.message
          : "Unable to add product to cart."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  // BUY NOW
  // This prepares a temporary one-product checkout.
  // It does not add this product to, or replace, the normal cart.

  const handleBuyNow = async () => {
    if (!validateSelection()) return;

    const user = getStoredUser();

    if (user?.role !== "customer") {
      router.push("/login");
      return;
    }

    try {
      setBuyingNow(true);
      setCartMessage("");
      setCartError("");

      const itemTotal = currentPrice * quantity;

      const buyNowCheckout = {
        items: [
          {
            id: -product.id,
            product_id: product.id,
            variant_id: selectedVariant?.id ?? null,
            quantity,
            product: {
              id: product.id,
              name: product.name,
              description: product.description ?? null,
              price: product.price,
              original_price: product.original_price ?? null,
              stock: product.stock,
              image_url:
                product.image ??
                product.images?.find((image) => image.is_primary)?.image_url ??
                product.images?.[0]?.image_url ??
                null,
              rating: product.rating ?? 0,
              reviews_count: product.reviews_count ?? 0,
            },
            variant: selectedVariant
              ? {
                  id: selectedVariant.id,
                  sku: selectedVariant.sku ?? null,
                  price: selectedVariant.price,
                  original_price: selectedVariant.original_price ?? null,
                  stock: selectedVariant.stock,
                  is_active: selectedVariant.is_active,
                  option_values: optionGroups.flatMap((group) => {
                    const value = group.values.find((option) =>
                      selectedVariant.option_value_ids.includes(option.id)
                    );
                    return value
                      ? [{
                          id: value.id,
                          option_group_id: group.id,
                          value: value.value,
                        }]
                      : [];
                  }),
                  images: selectedVariant.images.map((image) => ({
                    id: image.id,
                    image_url: image.image_url,
                    view_type: image.view_type ?? null,
                    sort_order: image.sort_order,
                    is_primary: image.is_primary,
                  })),
                }
              : null,
            item_total: itemTotal,
          },
        ],
        total_items: quantity,
        total: itemTotal,
      };

      sessionStorage.setItem(
        BUY_NOW_STORAGE_KEY,
        JSON.stringify(buyNowCheckout)
      );

      router.push("/checkout?mode=buy-now");
    } catch (buyError) {
      console.error("Buy Now error:", buyError);

      setCartError(
        buyError instanceof Error
          ? buyError.message
          : "Unable to proceed to checkout."
      );

      setBuyingNow(false);
    }
  };

  // IMAGE NAVIGATION

  const handleNextImage = () => {
    if (images.length <= 1) return;

    setSelectedImageIndex((index) =>
      index >= images.length - 1 ? 0 : index + 1
    );
  };

  const handlePreviousImage = () => {
    if (images.length <= 1) return;

    setSelectedImageIndex((index) =>
      index <= 0 ? images.length - 1 : index - 1
    );
  };

  // PAGE

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-5">
        <section className="grid gap-4 lg:grid-cols-2">
          {/* PRODUCT GALLERY */}

          <div className="border border-gray-200 bg-white">
            <div className="relative overflow-hidden bg-white">
              <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleWishlist}
                  disabled={wishlistLoading || wishlistBusy}
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
                      isWishlisted ? "fill-red-500 text-red-500" : ""
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
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-14 w-14 shrink-0 overflow-hidden border-2 bg-gray-50 ${
                      safeImageIndex === index
                        ? "border-gray-900"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    aria-label={`View product image ${index + 1}`}
                  >
                    <img
                      src={image.image_url}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
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

                <div
                  className="mt-2 flex flex-wrap items-center gap-2"
                  aria-label={`Product rating ${productRating.toFixed(1)} out of 5`}
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(productRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-100 text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-sm font-semibold text-gray-800">
                    {productRating.toFixed(1)} / 5
                  </span>

                  <span className="text-xs text-gray-500">
                    {productReviewsCount}{" "}
                    {productReviewsCount === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>

              {/* OPTIONS */}

              {hasVariants && (
                <div className="border-b border-gray-100 py-4">
                  <div className="space-y-5">
                    {optionGroups.map((group) => {
                      const selectedValueId = selectedOptions[group.id];

                      const selectedValue = group.values.find(
                        (value) => value.id === selectedValueId
                      );

                      return (
                        <div key={group.id}>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {group.name}
                            </p>

                            {selectedValue && (
                              <span className="text-xs text-gray-500">
                                : {selectedValue.value}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {group.values.map((value) => {
                              const isSelected =
                                selectedValueId === value.id;

                              const isAvailable = isOptionValueAvailable(
                                group.id,
                                value.id
                              );

                              return (
                                <button
                                  key={value.id}
                                  type="button"
                                  onClick={() =>
                                    handleOptionSelect(group, value.id)
                                  }
                                  disabled={
                                    !isAvailable ||
                                    addingToCart ||
                                    buyingNow
                                  }
                                  title={
                                    !isAvailable
                                      ? "This option combination is unavailable"
                                      : undefined
                                  }
                                  className={`min-h-9 border px-4 py-2 text-xs font-medium transition ${
                                    isSelected
                                      ? "border-gray-900 bg-gray-900 text-white"
                                      : isAvailable
                                        ? "border-gray-300 bg-white text-gray-700 hover:border-gray-700"
                                        : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300 line-through"
                                  } disabled:opacity-70`}
                                >
                                  {value.value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PRICE */}

              <div className="border-b border-gray-100 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-3xl font-semibold text-gray-900">
                    ₹{currentPrice.toLocaleString("en-IN")}
                  </span>

                  {hasDiscount && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹
                      {Number(currentOriginalPrice).toLocaleString("en-IN")}
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
                {currentStock > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-green-600">
                      In Stock
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {currentStock} units available
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

              {currentStock > 0 && (
                <div className="border-b border-gray-100 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      Quantity
                    </p>
                    <span className="text-xs text-gray-400">
                      Max {currentStock}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center border border-gray-300">
                      <button
                        type="button"
                        onClick={handleDecreaseQuantity}
                        disabled={
                          quantity <= 1 || addingToCart || buyingNow
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
                        onClick={handleIncreaseQuantity}
                        disabled={
                          quantity >= currentStock ||
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
                        ₹{(currentPrice * quantity).toLocaleString("en-IN")}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* SUCCESS AND ERROR MESSAGES */}

              {cartMessage && (
                <div className="mt-3 border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                  {cartMessage}
                </div>
              )}

              {cartError && (
                <div
                  role="alert"
                  className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                >
                  {cartError}
                </div>
              )}

              {/* CART AND BUY NOW BUTTONS */}

              {currentStock > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isProductInCart) {
                        router.push("/cart");
                        return;
                      }

                      void handleAddToCart();
                    }}
                    disabled={
                      addingToCart ||
                      buyingNow ||
                      (!isProductInCart &&
                        hasVariants &&
                        (!allRequiredOptionsSelected || !selectedVariant))
                    }
                    className={`flex h-11 items-center justify-center gap-2 px-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isProductInCart
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />

                    {addingToCart
                      ? "Adding..."
                      : isProductInCart
                        ? "Go to Cart"
                        : "Add to Cart"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleBuyNow()}
                    disabled={
                      addingToCart ||
                      buyingNow ||
                      (hasVariants &&
                        (!allRequiredOptionsSelected || !selectedVariant))
                    }
                    className="flex h-11 items-center justify-center gap-2 bg-yellow-500 px-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    {buyingNow ? "Processing..." : "Buy Now"}
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

        {/* RELATED PRODUCTS */}

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
              {relatedProducts.map((item) => {
                const relatedImages = item.images ?? [];

                const relatedImage =
                  relatedImages.find((image) => image.is_primary)?.image_url ||
                  relatedImages[0]?.image_url ||
                  item.image ||
                  null;

                const itemHasDiscount =
                  item.original_price != null &&
                  Number(item.original_price) > Number(item.price);

                const itemDiscount =
                  itemHasDiscount && Number(item.original_price) > 0
                    ? Math.round(
                        ((Number(item.original_price) - Number(item.price)) /
                          Number(item.original_price)) *
                          100
                      )
                    : 0;

                const itemRating = Math.min(
                  5,
                  Math.max(0, Number(item.rating ?? 0))
                );

                return (
                  <Link
                    key={item.id}
                    href={`/products/${item.slug || item.id}`}
                    className="group block"
                  >
                    <article className="overflow-hidden border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-md">
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        {relatedImage ? (
                          <img
                            src={relatedImage}
                            alt={item.name}
                            loading="lazy"
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

                        <div
                          className="mt-1 flex items-center gap-1"
                          aria-label={`Rating ${itemRating.toFixed(1)} out of 5`}
                        >
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= Math.round(itemRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-100 text-gray-300"
                                }`}
                              />
                            ))}
                          </div>

                          <span className="text-[11px] text-gray-600">
                            {itemRating.toFixed(1)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-gray-900">
                            ₹{Number(item.price).toLocaleString("en-IN")}
                          </p>

                          {itemHasDiscount && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹
                              {Number(item.original_price).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          )}
                        </div>

                        <div className="mt-1">
                          {Number(item.stock) > 0 ? (
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
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}