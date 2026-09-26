"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import {
  getMyProducts,
  type Product,
} from "@/services/products";

import { getStoredUser } from "@/services/auth";

export default function SellerDashboardPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [sellerName, setSellerName] =
    useState("Seller");

  // =====================================================
  // LOAD SELLER DATA
  // =====================================================

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        // -------------------------------------------------
        // GET LOGGED-IN SELLER
        // -------------------------------------------------

        const user = getStoredUser();

        if (user?.full_name) {
          setSellerName(user.full_name);
        }

        // -------------------------------------------------
        // GET SELLER'S PRODUCTS
        // -------------------------------------------------

        const result =
          await getMyProducts();

        setProducts(result);
      } catch (error) {
        console.error(
          "Seller dashboard error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load seller dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // =====================================================
  // CALCULATE COUNTS
  // =====================================================

  const totalProducts =
    products.length;

  const inStockProducts =
    products.filter(
      (product) => product.stock > 0
    ).length;

  const outOfStockProducts =
    products.filter(
      (product) => product.stock <= 0
    ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

            <p className="mt-4 text-sm text-gray-500">
              Loading seller dashboard...
            </p>
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
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-semibold text-red-700">
            Unable to load dashboard
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">

      {/* =================================================
          HEADER
      ================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm font-medium text-gray-500">
            Seller Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Welcome, {sellerName}
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your products from here.
          </p>
        </div>

        {/* ADD PRODUCT */}

        <Link
          href="/seller/dashboard/products/add"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>

      </div>

      {/* =================================================
          STAT CARDS
      ================================================== */}

      <div className="grid gap-4 md:grid-cols-3">

        {/* TOTAL PRODUCTS */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                My Products
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalProducts}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <ShoppingBag className="h-6 w-6 text-gray-700" />
            </div>

          </div>

        </div>

        {/* IN STOCK */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                In Stock
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {inStockProducts}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>

          </div>

        </div>

        {/* OUT OF STOCK */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Out of Stock
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {outOfStockProducts}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          QUICK ACTIONS
      ================================================== */}

      <section className="mt-8">

        <h2 className="text-xl font-semibold text-gray-900">
          Quick Actions
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">

          {/* MANAGE PRODUCTS */}

          <Link
            href="/seller/dashboard/products"
            className="group rounded-xl border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Package className="h-6 w-6 text-gray-700" />
              </div>

              <span className="text-sm text-gray-400 transition group-hover:translate-x-1">
                →
              </span>

            </div>

            <h3 className="mt-5 text-lg font-semibold text-gray-900">
              Manage Products
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              View, edit, update stock, and delete your products.
            </p>

          </Link>

          {/* ADD PRODUCT */}

          <Link
            href="/seller/dashboard/products/add"
            className="group rounded-xl border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Plus className="h-6 w-6 text-gray-700" />
              </div>

              <span className="text-sm text-gray-400 transition group-hover:translate-x-1">
                →
              </span>

            </div>

            <h3 className="mt-5 text-lg font-semibold text-gray-900">
              Add New Product
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Add a new product to your ShopSphere store.
            </p>

          </Link>

        </div>

      </section>

      {/* =================================================
          RECENT PRODUCTS
      ================================================== */}

      <section className="mt-10">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              My Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your currently active products.
            </p>
          </div>

          <Link
            href="/seller/dashboard/products"
            className="text-sm font-medium text-gray-700 hover:text-black"
          >
            View all
          </Link>

        </div>

        {products.length === 0 ? (
          <div className="mt-4 rounded-xl border bg-white p-10 text-center">

            <Package className="mx-auto h-12 w-12 text-gray-300" />

            <h3 className="mt-4 text-lg font-semibold">
              No products yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Add your first product to start selling.
            </p>

            <Link
              href="/seller/dashboard/products/add"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>

          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border bg-white">

            <div className="divide-y">

              {products.slice(0, 5).map(
                (product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >

                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-gray-900">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        ₹
                        {product.price.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">

                      <p className="text-sm font-medium">
                        Stock: {product.stock}
                      </p>

                      <p
                        className={
                          product.stock > 0
                            ? "mt-1 text-xs text-green-600"
                            : "mt-1 text-xs text-red-600"
                        }
                      >
                        {product.stock > 0
                          ? "In stock"
                          : "Out of stock"}
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>
        )}

      </section>

    </main>
  );
}