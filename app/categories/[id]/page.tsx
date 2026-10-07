"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Package,
  SlidersHorizontal,
} from "lucide-react";

import ProductGrid from "@/components/products/ProductGrid";

import {
  getProductsByCategory,
  type Product,
} from "@/services/products";

import {
  getCategories,
  type Category,
} from "@/services/categories";

interface CategoryTreeItemProps {
  category: Category;
  categories: Category[];
  currentCategoryId: number;
  level?: number;
}

function CategoryTreeItem({
  category,
  categories,
  currentCategoryId,
  level = 0,
}: CategoryTreeItemProps) {
  const [open, setOpen] = useState(true);

  const children = useMemo(() => {
    return categories
      .filter(
        (item) =>
          item.parent_id === category.id &&
          item.is_active
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  }, [categories, category.id]);

  const hasChildren = children.length > 0;
  const isCurrent =
    category.id === currentCategoryId;

  return (
    <div className="relative">
      <div
        className={`group flex min-h-10 items-center rounded-lg transition-all duration-200 ${
          isCurrent
            ? "bg-gray-900 text-white shadow-sm"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
        }`}
        style={{
          marginLeft: `${Math.min(level * 12, 36)}px`,
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() =>
              setOpen((value) => !value)
            }
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-200 ${
              isCurrent
                ? "hover:bg-white/10"
                : "hover:bg-gray-100"
            }`}
            aria-label={
              open
                ? `Collapse ${category.name}`
                : `Expand ${category.name}`
            }
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${
                open ? "" : "-rotate-90"
              }`}
            />
          </button>
        ) : (
          <div className="w-9 shrink-0" />
        )}

        <Link
          href={`/categories/${category.slug}`}
          className="flex min-h-10 min-w-0 flex-1 items-center py-2 pr-2 text-sm font-medium"
        >
          <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5">
            {category.name}
          </span>
        </Link>

        {!isCurrent && (
          <ChevronRight className="mr-2 h-3.5 w-3.5 shrink-0 text-gray-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
        )}
      </div>

      {hasChildren && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            open
              ? "grid-rows-[1fr]"
              : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-1 space-y-1">
              {children.map((child) => (
                <CategoryTreeItem
                  key={child.id}
                  category={child}
                  categories={categories}
                  currentCategoryId={
                    currentCategoryId
                  }
                  level={level + 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams();

  const categorySlug = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [category, setCategory] =
    useState<Category | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    mobileCategoriesOpen,
    setMobileCategoriesOpen,
  ] = useState(false);

  useEffect(() => {
    if (!categorySlug) {
      return;
    }

    async function loadCategoryPage() {
      if (!categorySlug) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          allCategories,
          categoryProducts,
        ] = await Promise.all([
          getCategories(),
          getProductsByCategory(categorySlug),
        ]);

        const currentCategory =
          allCategories.find(
            (item) =>
              item.slug === categorySlug &&
              item.is_active
          );

        if (!currentCategory) {
          setError("Category not found.");
          return;
        }

        setCategories(allCategories);
        setProducts(categoryProducts);
        setCategory(currentCategory);
      } catch (err) {
        console.error(
          "Failed to load category page:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load category."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCategoryPage();
  }, [categorySlug]);

  const sidebarCategories = useMemo(() => {
    if (!category) {
      return [];
    }

    return categories.filter(
      (item) =>
        item.id === category.id &&
        item.is_active
    );
  }, [categories, category]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-6 h-7 w-48 rounded-md bg-gray-200" />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
              <div className="hidden h-72 rounded-xl bg-gray-100 lg:block" />

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({
                  length: 8,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[3/4] rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !category) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-6 w-6 text-gray-500" />
            </div>

            <h1 className="text-xl font-bold text-gray-900">
              Category not found
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {error ||
                "The category you are looking for does not exist."}
            </p>

            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-black hover:shadow-md active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              All products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/40">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {/* BACK TO PRODUCTS */}
        <div className="mb-3">
          <Link
            href="/products"
            className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-white hover:text-gray-900 hover:shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            All products
          </Link>
        </div>

        {/* MOBILE CATEGORY BUTTON */}
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            onClick={() =>
              setMobileCategoriesOpen(
                (value) => !value
              )
            }
            className="group flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-gray-500 transition-transform duration-200 group-hover:rotate-12" />
              Categories
            </span>

            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                mobileCategoriesOpen
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
          {/* SIDEBAR */}
          <aside
            className={`${
              mobileCategoriesOpen
                ? "block"
                : "hidden"
            } lg:block`}
          >
            <div className="sticky top-20 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
              {/* SIDEBAR HEADER */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Categories
                  </h2>

                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Related categories
                  </p>
                </div>

                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-500">
                  {sidebarCategories.length}
                </span>
              </div>

              {/* CATEGORY TREE */}
              <div className="p-2.5">
                {sidebarCategories.map(
                  (item) => (
                    <CategoryTreeItem
                      key={item.id}
                      category={item}
                      categories={categories}
                      currentCategoryId={
                        category.id
                      }
                    />
                  )
                )}
              </div>
            </div>
          </aside>

          {/* PRODUCT AREA */}
          <section className="min-w-0">
            {/* PRODUCT HEADER */}
            <div className="mb-3">
              <h2 className="truncate text-sm font-bold text-gray-900 sm:text-base">
                {category.name} products
              </h2>

              <p className="mt-0.5 text-[11px] text-gray-400 sm:text-xs">
                Explore products in this category
              </p>
            </div>

            {products.length === 0 ? (
              <div className="flex min-h-[330px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>

                <h3 className="text-base font-bold text-gray-900">
                  No products available
                </h3>

                <p className="mt-1.5 text-sm text-gray-500">
                  There are no products in this category yet.
                </p>

                <Link
                  href="/products"
                  className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-black hover:shadow-md active:scale-[0.98]"
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <ProductGrid products={products} />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}