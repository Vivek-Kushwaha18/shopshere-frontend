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

        <ProductGrid
          products={products}
        />
      )}

    </main>
  );
}