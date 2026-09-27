"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

import {
  getProduct,
  getProductsByCategory,
  type Product,
} from "@/services/products";

export default function ProductDetailsPage() {
  const params = useParams();

  const productId = Number(params.id);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [relatedProducts, setRelatedProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // SELECTED IMAGE
  // =====================================================

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  // =====================================================
  // LOAD PRODUCT
  // =====================================================

  useEffect(() => {
    async function loadProduct() {
      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        setError("Invalid product.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const productData =
          await getProduct(productId);

        setProduct(productData);

        // =================================================
        // PRODUCT IMAGES
        // =================================================

        const productImages =
          productData.images ?? [];

        // =================================================
        // FIND PRIMARY IMAGE
        // =================================================

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
        // LOAD PRODUCTS FROM SAME CATEGORY
        // =================================================

        const categoryProducts =
          await getProductsByCategory(
            productData.category_id
          );

        setRelatedProducts(
          categoryProducts.filter(
            (item) =>
              item.id !== productData.id
          )
        );
      } catch (error) {
        console.error(
          "Product details error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-gray-500">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h1 className="text-xl font-semibold">
            Unable to load product
          </h1>

          <p className="mt-2">
            {error || "Product not found."}
          </p>

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

  // =====================================================
  // PRODUCT IMAGES
  // =====================================================

  const images = product.images ?? [];

  const currentImage =
    images[selectedImageIndex]?.image_url ??
    null;

  // =====================================================
  // DISCOUNT
  // =====================================================

  const hasDiscount =
    product.original_price != null &&
    product.original_price > product.price;

  // =====================================================
  // NEXT IMAGE
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

  // =====================================================
  // PREVIOUS IMAGE
  // =====================================================

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

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">

      {/* =================================================
          BACK
      ================================================== */}

      <Link
        href="/products"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      {/* =================================================
          PRODUCT INFORMATION
      ================================================== */}

      <section className="grid gap-10 md:grid-cols-2">

        {/* =================================================
            PRODUCT IMAGE SLIDER
        ================================================== */}

        <div>

          {/* =================================================
              MAIN IMAGE
          ================================================== */}

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

            {/* =================================================
                PREVIOUS BUTTON
            ================================================== */}

            {images.length > 1 && (
              <button
                type="button"
                onClick={handlePreviousImage}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* =================================================
                NEXT BUTTON
            ================================================== */}

            {images.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

          </div>

          {/* =================================================
              IMAGE THUMBNAILS
          ================================================== */}

          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">

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
                    className={`aspect-square overflow-hidden rounded-lg border-2 bg-gray-100 ${
                      selectedImageIndex === index
                        ? "border-black"
                        : "border-gray-200"
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

          {/* =================================================
              IMAGE COUNT
          ================================================== */}

          {images.length > 1 && (
            <p className="mt-3 text-center text-sm text-gray-500">
              Image {selectedImageIndex + 1} of{" "}
              {images.length}
            </p>
          )}

        </div>

        {/* =================================================
            PRODUCT INFORMATION
        ================================================== */}

        <div>

          <p className="text-sm text-gray-500">
            Product
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* =================================================
              PRICE
          ================================================== */}

          <div className="mt-6 flex items-center gap-3">

            <span className="text-3xl font-bold text-gray-900">
              ₹
              {product.price.toLocaleString(
                "en-IN"
              )}
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

          {/* =================================================
              STOCK
          ================================================== */}

          <div className="mt-5">
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

          {/* =================================================
              DESCRIPTION
          ================================================== */}

          <div className="mt-8">

            <h2 className="text-lg font-semibold">
              Product Description
            </h2>

            <p className="mt-3 whitespace-pre-line text-gray-600">
              {product.description ||
                "No description available."}
            </p>

          </div>

          {/* =================================================
              PRODUCT DETAILS
          ================================================== */}

          <div className="mt-8 border-t pt-6">

            <h2 className="text-lg font-semibold">
              Product Information
            </h2>

            <div className="mt-4 space-y-3 text-sm">

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Product ID
                </span>

                <span className="font-medium">
                  {product.id}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Category ID
                </span>

                <span className="font-medium">
                  {product.category_id}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Seller ID
                </span>

                <span className="font-medium">
                  {product.seller_id}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Available Stock
                </span>

                <span className="font-medium">
                  {product.stock}
                </span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =================================================
          SAME CATEGORY PRODUCTS
      ================================================== */}

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

            {relatedProducts.map(
              (item) => {
                const relatedImages =
                  item.images ?? [];

                const relatedImage =
                  relatedImages.find(
                    (image) =>
                      image.is_primary
                  )?.image_url ||
                  relatedImages[0]?.image_url ||
                  null;

                return (
                  <Link
                    key={item.id}
                    href={`/products/${item.id}`}
                    className="group"
                  >
                    <article className="overflow-hidden rounded-xl border bg-white transition hover:-translate-y-1 hover:shadow-lg">

                      {/* IMAGE */}

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

                      {/* DETAILS */}

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
              }
            )}

          </div>
        </section>
      )}

    </main>
  );
}