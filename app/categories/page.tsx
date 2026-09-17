"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCategories } from "@/services/category";
import type { Category } from "@/types/category";

export default function CategoriesPage() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();

        setCategories(
          data.filter(
            (category) => !category.is_deleted
          )
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load categories."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Categories
        </h1>

        <p className="mt-2 text-gray-600">
          Browse products by category.
        </p>
      </div>

      {loading && <p>Loading categories...</p>}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-600">
            {error}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        categories.length === 0 && (
          <div className="rounded-lg border p-8 text-center">
            No categories available.
          </div>
        )}

      {!loading &&
        !error &&
        categories.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="rounded-xl border bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h2 className="text-xl font-semibold">
                  {category.name}
                </h2>

                <p className="mt-3 text-sm text-gray-500">
                  View products →
                </p>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}