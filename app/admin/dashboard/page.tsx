"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Package,
  FolderTree,
  Users,
  ArrowRight,
} from "lucide-react";

import { getProducts } from "@/services/products";
import { getCategories } from "@/services/categories";

// =====================================================
// DASHBOARD CACHE
// =====================================================

let dashboardCache: {
  productCount: number;
  categoryCount: number;
} | null = null;

let dashboardRequest: Promise<{
  productCount: number;
  categoryCount: number;
}> | null = null;

async function getDashboardCounts() {
  // Return cached data immediately
  if (dashboardCache) {
    return dashboardCache;
  }

  // Reuse existing request if one is already running
  if (dashboardRequest) {
    return dashboardRequest;
  }

  dashboardRequest = Promise.all([
    getProducts(),
    getCategories(),
  ])
    .then(([products, categories]) => {
      const result = {
        productCount: products.length,
        categoryCount: categories.length,
      };

      dashboardCache = result;

      return result;
    })
    .finally(() => {
      dashboardRequest = null;
    });

  return dashboardRequest;
}

// =====================================================
// INVALIDATE DASHBOARD CACHE
// =====================================================

export function clearDashboardCache() {
  dashboardCache = null;
}

export default function AdminDashboardPage() {
  // =====================================================
  // INITIAL STATE
  // =====================================================

  const [productCount, setProductCount] =
    useState<number | null>(
      dashboardCache?.productCount ?? null
    );

  const [categoryCount, setCategoryCount] =
    useState<number | null>(
      dashboardCache?.categoryCount ?? null
    );

  const [loading, setLoading] =
    useState(dashboardCache === null);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        // If cache already exists, don't show loading again
        if (dashboardCache) {
          if (!isMounted) {
            return;
          }

          setProductCount(
            dashboardCache.productCount
          );

          setCategoryCount(
            dashboardCache.categoryCount
          );

          setLoading(false);

          return;
        }

        setError("");

        const result =
          await getDashboardCounts();

        if (!isMounted) {
          return;
        }

        setProductCount(
          result.productCount
        );

        setCategoryCount(
          result.categoryCount
        );

        setLoading(false);
      } catch (error) {
        console.error(
          "Admin dashboard error:",
          error
        );

        if (!isMounted) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard."
        );

        setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <div className="mb-8">
            <p className="text-sm font-medium text-gray-500">
              ShopSphere Admin
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>

        </div>
      </main>
    );
  }

  // =====================================================
  // WAIT ONLY FOR FIRST REQUEST
  // =====================================================

  if (
    loading ||
    productCount === null ||
    categoryCount === null
  ) {
    return null;
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}

        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            ShopSphere Admin
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>

        </div>

        {/* Dashboard Cards */}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Products */}

          <Link
            href="/admin/dashboard/products"
            className="group"
          >
            <div className="rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <Package className="h-6 w-6 text-gray-700" />
                </div>

                <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />

              </div>

              <h2 className="mt-5 text-xl font-semibold text-gray-900">
                Products
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                View, edit and manage all products.
              </p>

              <div className="mt-5 text-2xl font-bold text-gray-900">
                {productCount}
              </div>

              <p className="text-sm text-gray-500">
                Active products
              </p>

            </div>
          </Link>

          {/* Categories */}

          <Link
            href="/admin/dashboard/categories"
            className="group"
          >
            <div className="rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <FolderTree className="h-6 w-6 text-gray-700" />
                </div>

                <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />

              </div>

              <h2 className="mt-5 text-xl font-semibold text-gray-900">
                Categories
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Add, edit and delete product categories.
              </p>

              <div className="mt-5 text-2xl font-bold text-gray-900">
                {categoryCount}
              </div>

              <p className="text-sm text-gray-500">
                Active categories
              </p>

            </div>
          </Link>

          {/* Users */}

          <Link
            href="/admin/dashboard/users"
            className="group"
          >
            <div className="rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <Users className="h-6 w-6 text-gray-700" />
                </div>

                <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />

              </div>

              <h2 className="mt-5 text-xl font-semibold text-gray-900">
                Users
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                View and manage customers, sellers and admins.
              </p>

              <div className="mt-5 text-2xl font-bold text-gray-900">
                Manage
              </div>

              <p className="text-sm text-gray-500">
                User management
              </p>

            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}