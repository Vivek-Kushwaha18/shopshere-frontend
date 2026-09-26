"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
} from "lucide-react";

import {
  getProductsByCategory,
  type Product,
} from "@/services/products";

export default function CategoryProductsPage() {
  const params = useParams();

  const categoryId = Number(params.id);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD PRODUCTS OF SELECTED CATEGORY
  // =====================================================

  useEffect(() => {
    async function loadCategoryProducts() {
      if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
      ) {
        setError("Invalid category.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result =
          await getProductsByCategory(
            categoryId
          );

        setProducts(result);
      } catch (error) {
        console.error(
          "Category products loading error:",
          error
        );

        setProducts([]);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load category products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCategoryProducts();
  }, [categoryId]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-gray-500">
            Loading products...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">

          <h1 className="text-xl font-semibold text-red-700">
            Unable to load category products
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            All Products
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">

      {/* =================================================
          BACK
      ================================================== */}

      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        All Products
      </Link>

      {/* =================================================
          CATEGORY HEADER
      ================================================== */}

      <section className="mb-8">

        <p className="text-sm font-medium text-gray-500">
          Category
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          Category Products
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Showing products from category ID{" "}
          {categoryId}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {products.length}{" "}
          {products.length === 1
            ? "product"
            : "products"}{" "}
          found
        </p>

      </section>

      {/* =================================================
          NO PRODUCTS
      ================================================== */}

      {products.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">

          <Package className="mx-auto h-12 w-12 text-gray-300" />

          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            No products found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            There are currently no products in this category.
          </p>

        </div>
      ) : (
        /* =================================================
           PRODUCTS
        ================================================== */

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

          {products.map((product) => {
            const hasDiscount =
              product.original_price != null &&
              product.original_price >
                product.price;

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group block"
              >
                <article className="overflow-hidden rounded-xl border bg-white transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  {/* IMAGE */}

                  <div className="relative aspect-square overflow-hidden bg-gray-100">

                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}

                    {/* SALE */}

                    {hasDiscount && (
                      <span className="absolute left-3 top-3 rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                        Sale
                      </span>
                    )}

                  </div>

                  {/* PRODUCT DETAILS */}

                  <div className="p-4">

                    <h2 className="line-clamp-2 min-h-[48px] font-semibold text-gray-900">
                      {product.name}
                    </h2>

                    {/* PRICE */}

                    <div className="mt-3 flex items-center gap-2">

                      <span className="text-lg font-bold text-gray-900">
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

                    </div>

                    {/* STOCK */}

                    <p className="mt-2 text-sm">
                      {product.stock > 0 ? (
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
      )}

    </main>
  );
}