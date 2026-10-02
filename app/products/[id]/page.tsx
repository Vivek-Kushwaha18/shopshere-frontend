"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Minus,
  Package,
  Plus,
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

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!productSlug.trim()) {
        if (!isMounted) return;

        setError("Invalid product.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const productData = await getProduct(productSlug);

        if (!isMounted) return;

        setProduct(productData);
        setQuantity(1);
        setCartMessage("");
        setCartError("");

        const productImages = productData.images ?? [];

        const primaryImageIndex = productImages.findIndex(
          (image) => image.is_primary
        );

        setSelectedImageIndex(
          primaryImageIndex >= 0 ? primaryImageIndex : 0
        );

        const category = await getCategory(productData.category_id);

        if (!isMounted) return;

        const categoryProducts = await getProductsByCategory(
          category.slug
        );

        if (!isMounted) return;

        setRelatedProducts(
          categoryProducts.filter(
            (item) => item.id !== productData.id
          )
        );
      } catch (error) {
        console.error("Product details error:", error);

        if (!isMounted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load product."
        );
      } finally {
        if (!isMounted) return;

        setLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productSlug]);

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h1 className="text-xl font-semibold">
            Unable to load product
          </h1>

          <p className="mt-2">{error}</p>

          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  if (loading || product === null) {
    return null;
  }

  const images = product.images ?? [];

  const currentImage =
    images[selectedImageIndex]?.image_url ?? null;

  const hasDiscount =
    product.original_price != null &&
    product.original_price > product.price;

  const handleDecreaseQuantity = () => {
    setQuantity((currentQuantity) =>
      Math.max(1, currentQuantity - 1)
    );
  };

  const handleIncreaseQuantity = () => {
    setQuantity((currentQuantity) =>
      Math.min(product.stock, currentQuantity + 1)
    );
  };

  const handleAddToCart = async () => {
    if (product.stock <= 0) {
      setCartError("This product is out of stock.");
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
          quantity === 1 ? "item" : "items"
        } added to cart.`
      );

      setTimeout(() => {
        setCartMessage("");
      }, 1000);
    } catch (error) {
      console.error("Add to cart error:", error);

      setCartError(
        error instanceof Error
          ? error.message
          : "Unable to add product to cart."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (product.stock <= 0) {
      setCartError("This product is out of stock.");
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
      console.error("Buy now error:", error);

      setCartError(
        error instanceof Error
          ? error.message
          : "Unable to proceed to cart."
      );

      setBuyingNow(false);
    }
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;

    setSelectedImageIndex(
      (currentIndex) =>
        currentIndex === images.length - 1
          ? 0
          : currentIndex + 1
    );
  };

  const handlePreviousImage = () => {
    if (images.length <= 1) return;

    setSelectedImageIndex(
      (currentIndex) =>
        currentIndex === 0
          ? images.length - 1
          : currentIndex - 1
    );
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {/* Back to Products */}
      <Link
        href="/products"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <section className="grid gap-10 md:grid-cols-2">
        {/* Product Images */}
        <div className="relative overflow-hidden rounded-xl border bg-gray-100">
          <div className="aspect-square">
            {currentImage ? (
              <img
                src={currentImage}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-20 w-20 text-gray-300" />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePreviousImage}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md hover:bg-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md hover:bg-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Product Information */}
        <div>
          {/* Product Name */}
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700">
              Product:{" "}
              <span className="font-semibold text-gray-900">
                {product.name}
              </span>
            </p>
          </div>

          {/* Product Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-3">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex(index)
                  }
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-gray-100 ${
                    selectedImageIndex === index
                      ? "border-black"
                      : "border-gray-200"
                  }`}
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

          {/* Price and Purchase Information */}
          <div className="mt-6">
            {/* Stock */}
            <div className="mb-2">
              {product.stock > 0 ? (
                <p className="font-medium text-green-600">
                  In stock
                </p>
              ) : (
                <p className="font-medium text-red-600">
                  Out of stock
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">
                ₹{product.price.toLocaleString("en-IN")}
              </span>

              {hasDiscount && (
                <span className="text-lg text-gray-400 line-through">
                  ₹
                  {product.original_price!.toLocaleString(
                    "en-IN"
                  )}
                </span>
              )}
            </div>

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Quantity
                </p>

                <div className="flex w-fit items-center rounded-lg border">
                  <button
                    type="button"
                    onClick={handleDecreaseQuantity}
                    disabled={
                      quantity <= 1 ||
                      addingToCart ||
                      buyingNow
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-l-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="flex h-10 min-w-12 items-center justify-center border-x px-3 font-medium">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={handleIncreaseQuantity}
                    disabled={
                      quantity >= product.stock ||
                      addingToCart ||
                      buyingNow
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-r-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Cart Success Message */}
            {cartMessage && (
              <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {cartMessage}
              </div>
            )}

            {/* Cart Error Message */}
            {cartError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {cartError}
              </div>
            )}

            {/* Add to Cart and Buy Now */}
            {product.stock > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                    addingToCart ||
                    buyingNow
                  }
                  className="flex items-center justify-center gap-2 rounded-lg border border-black bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />

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
                  className="flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="h-5 w-5" />

                  {buyingNow
                    ? "Processing..."
                    : `Buy at ₹${product.price.toLocaleString(
                        "en-IN"
                      )}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t pt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              More Products From This Category
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Explore other products in the same category.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {relatedProducts.map((item) => {
              const relatedImages = item.images ?? [];

              const relatedImage =
                relatedImages.find(
                  (image) => image.is_primary
                )?.image_url ||
                relatedImages[0]?.image_url ||
                null;

              return (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  className="group"
                >
                  <article className="overflow-hidden rounded-xl border bg-white transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      {relatedImage ? (
                        <img
                          src={relatedImage}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 min-h-[48px] font-semibold text-gray-900">
                        {item.name}
                      </h3>

                      <p className="mt-3 text-lg font-bold">
                        ₹
                        {item.price.toLocaleString(
                          "en-IN"
                        )}
                      </p>

                      <p className="mt-2 text-sm">
                        {item.stock > 0 ? (
                          <span className="text-green-600">
                            In stock
                          </span>
                        ) : (
                          <span className="text-red-600">
                            Out of stock
                          </span>
                        )}
                      </p>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}