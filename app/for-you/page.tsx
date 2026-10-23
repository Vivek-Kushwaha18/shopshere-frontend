
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  ShoppingBag,
  Clock,
  Sparkles,
} from "lucide-react";

import {
  getProducts,
  type Product,
} from "@/services/products";

import { getRecentlyViewedProductIds } from "@/services/recently-viewed";

// =====================================================
// PRODUCT GRID
// =====================================================

function ProductGrid({
  products,
}: {
  products: Product[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map((product) => {
        // Product details support slugs. Use the numeric ID only
        // when the product does not have a slug.
        const productIdentifier =
          String(product.slug ?? "").trim() ||
          String(product.id);

        return (
          <Link
            key={product.id}
            href={`/products/${encodeURIComponent(
              productIdentifier
            )}`}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden bg-gray-50">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 px-3 text-center text-sm text-gray-400">
                  <ShoppingBag className="h-8 w-8" />
                  <span>No image available</span>
                </div>
              )}
            </div>

            <div className="p-3">
              <h3 className="line-clamp-2 min-h-10 text-sm font-medium text-gray-800">
                {product.name}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-bold text-gray-900">
                  ₹
                  {Number(product.price).toLocaleString(
                    "en-IN"
                  )}
                </span>

                {product.original_price != null &&
                  Number(product.original_price) >
                    Number(product.price) && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹
                      {Number(
                        product.original_price
                      ).toLocaleString("en-IN")}
                    </span>
                  )}
              </div>

              {Number(product.rating) > 0 && (
                <p className="mt-1 text-xs text-green-700">
                  ★ {Number(product.rating).toFixed(1)} rating
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// =====================================================
// LOADING SKELETON
// =====================================================

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border bg-white"
        >
          <div className="aspect-square animate-pulse bg-gray-200" />

          <div className="space-y-2 p-3">
            <div className="h-4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// FOR YOU PAGE
// =====================================================

export default function ForYouPage() {
  const [loading, setLoading] = useState(true);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [viewedProducts, setViewedProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] =
    useState<Product[]>([]);

  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // ===================================================
  // LOAD PRODUCTS AND BUILD RECOMMENDATIONS
  // ===================================================

  const loadForYou = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const products = await getProducts();

      const availableProducts = products.filter(
        (product) =>
          product.is_active !== false &&
          product.is_deleted !== true
      );

      // Match recently viewed product IDs with actual products.
      const viewedIds = getRecentlyViewedProductIds();

      const productMap = new Map(
        availableProducts.map((product) => [
          String(product.id),
          product,
        ])
      );

      // Preserve the recently viewed order.
      const recentlyViewed = viewedIds
        .map((id) => productMap.get(String(id)))
        .filter(
          (product): product is Product =>
            product !== undefined
        );

      const viewedIdSet = new Set(
        recentlyViewed.map((product) =>
          String(product.id)
        )
      );

      const latestViewed = recentlyViewed[0];

      // Prefer products in the latest viewed product's category.
      const sameCategoryRecommendations =
        latestViewed?.category_id != null
          ? availableProducts.filter(
              (product) =>
                !viewedIdSet.has(String(product.id)) &&
                product.category_id != null &&
                String(product.category_id) ===
                  String(latestViewed.category_id)
            )
          : [];

      const sameCategoryIds = new Set(
        sameCategoryRecommendations.map((product) =>
          String(product.id)
        )
      );

      // Fill the remaining recommendations with other products.
      const otherRecommendations =
        availableProducts.filter(
          (product) =>
            !viewedIdSet.has(String(product.id)) &&
            !sameCategoryIds.has(String(product.id))
        );

      setAllProducts(availableProducts);
      setViewedProducts(recentlyViewed);

      setRecommendedProducts([
        ...sameCategoryRecommendations,
        ...otherRecommendations,
      ]);
    } catch (loadError) {
      console.error(
        "For You loading error:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load products. Please try again."
      );

      setAllProducts([]);
      setViewedProducts([]);
      setRecommendedProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // INITIAL LOAD AND RETRY
  // ===================================================

  useEffect(() => {
    void loadForYou();
  }, [loadForYou, retryCount]);

  const handleRetry = () => {
    setRetryCount((previous) => previous + 1);
  };

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />

          <div className="mb-8 h-36 animate-pulse rounded-2xl bg-gray-200" />

          <ProductGridSkeleton />
        </div>
      </main>
    );
  }

  // ===================================================
  // ERROR STATE
  // ===================================================

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-xl border bg-white p-8 text-center">
          <p className="text-red-600">{error}</p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </main>
    );
  }

  // ===================================================
  // PAGE CONTENT
  // ===================================================

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* PAGE BANNER */}

        {/*<section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-8 text-white sm:px-8">*/}
          {/*<p className="flex items-center gap-2 text-sm font-semibold text-blue-100">
            <Sparkles className="h-4 w-4" />
            SHOPSPHERE PERSONALIZED SHOPPING
          </p>*/}

          {/*<h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            For You
          </h1>*/}

          {/*<p className="mt-2 max-w-xl text-sm text-blue-100 sm:text-base">
            Pick up where you left off and discover more products
            based on your recent browsing activity.
          </p>*/}
        {/*</section>*/}

        {/* RECENTLY VIEWED PRODUCTS */}

        {viewedProducts.length > 0 ? (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Clock className="h-5 w-5 text-blue-700" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Recently viewed
                </h2>

                {/*<p className="mt-1 text-sm text-gray-500">
                  Products you opened recently, newest first
                </p>*/}
              </div>
            </div>

            <ProductGrid products={viewedProducts} />
          </section>
        ) : (
          <section className="mb-10 rounded-xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Clock className="h-7 w-7 text-blue-600" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Start exploring products
            </h2>

            {/*<p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
              When you open a product, it can appear here so you can
              easily find it again. Recently viewed products are saved
              in this browser.
            </p>*/}

            <Link
              href="/products"
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Explore products
            </Link>
          </section>
        )}

        {/* RECOMMENDED PRODUCTS */}

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Recommended for you
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {viewedProducts.length > 0
                ? "Discover more products, with related categories shown first"
                : "Explore products available in ShopSphere"}
            </p>
          </div>

          {recommendedProducts.length > 0 ? (
            <ProductGrid products={recommendedProducts} />
          ) : allProducts.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-gray-300" />

              <p className="mt-3 text-sm text-gray-500">
                No products are available right now.
              </p>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh products
              </button>
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-8 text-center">
              <p className="text-sm text-gray-500">
                You have viewed all currently available products.
              </p>

              <Link
                href="/products"
                className="mt-4 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Browse all products
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
