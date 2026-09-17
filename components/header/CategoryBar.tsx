"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getCategories } from "@/services/categories";
import { Category } from "@/types/category";

export default function CategoryBar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await getCategories();

        setCategories(response.categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);

        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return (
    <div className="border-t bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-3">

        {loading && (
          <span className="whitespace-nowrap text-sm text-gray-500">
            Loading categories...
          </span>
        )}

        {error && (
          <span className="whitespace-nowrap text-sm text-red-500">
            {error}
          </span>
        )}

        {!loading &&
          !error &&
          categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category_id=${category.id}`}
              className="whitespace-nowrap text-sm font-medium text-gray-700 transition hover:text-black"
            >
              {category.name}
            </Link>
          ))}

      </div>
    </div>
  );
}