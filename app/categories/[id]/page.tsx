"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Package,
} from "lucide-react";

import ProductGrid from "@/components/products/ProductGrid";

import {
  getProductsByCategory,
  type Product,
} from "@/services/products";

export default function CategoryProductsPage() {
  const params = useParams();

  const categoryId = Number(params.id);

  // null = products are still loading
  // [] = API loaded but category has no products
  // array = products loaded
  const [products, setProducts] =
    useState<Product[] | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD PRODUCTS OF SELECTED CATEGORY
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    async function loadCategoryProducts() {
      if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
      ) {
        if (!isMounted) return;

        setError("Invalid category.");
        setProducts([]);
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

        if (!isMounted) return;

        setProducts(result);
      } catch (error) {
        console.error(
          "Category products loading error:",
          error
        );

        if (!isMounted) return;

        setProducts([]);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load category products."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCategoryProducts();

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

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

  // =====================================================
  // UI
  // =====================================================

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
          PRODUCTS AREA
      ================================================== */}

      {loading || products === null ? null : products.length === 0 ? (
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
        <ProductGrid
          products={products}
        />
      )}

    </main>
  );
}