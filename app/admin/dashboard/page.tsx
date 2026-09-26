"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Package,
  FolderTree,
  ArrowRight,
} from "lucide-react";

import { getProducts } from "@/services/products";
import { getCategories } from "@/services/categories";

export default function AdminDashboardPage() {
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [products, categories] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        setProductCount(products.length);
        setCategoryCount(categories.length);
      } catch (error) {
        console.error("Admin dashboard error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

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

          <p className="mt-2 text-gray-600">
            Manage products and categories across ShopSphere.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-2">
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
                {loading ? "..." : productCount}
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
                {loading ? "..." : categoryCount}
              </div>

              <p className="text-sm text-gray-500">
                Active categories
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}