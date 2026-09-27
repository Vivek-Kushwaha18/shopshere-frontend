"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Package } from "lucide-react";

import ProductSearch from "@/components/products/ProductSearch";
import ProductFilters from "@/components/products/ProductFilters";
import ProductGrid from "@/components/products/ProductGrid";

import {
  getCategories,
  type Category,
} from "@/services/categories";

import {
  getProducts,
  type Product,
} from "@/services/products";

function ProductsContent() {
  const searchParams = useSearchParams();

  // =====================================================
  // URL SEARCH
  // =====================================================

  const urlSearch =
    searchParams.get("search")?.trim() || "";

  // =====================================================
  // URL CATEGORY
  // =====================================================

  const categoryParam =
    searchParams.get("category");

  const parsedCategoryId =
    categoryParam
      ? Number(categoryParam)
      : null;

  const urlCategoryId =
    parsedCategoryId !== null &&
    Number.isInteger(parsedCategoryId) &&
    parsedCategoryId > 0
      ? parsedCategoryId
      : null;

  // =====================================================
  // PRODUCT DATA
  // =====================================================

  const [products, setProducts] =
    useState<Product[]>([]);

  // =====================================================
  // CATEGORY DATA
  // =====================================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  // =====================================================
  // SEARCH
  // =====================================================

  const [search, setSearch] =
    useState(urlSearch);

  // =====================================================
  // FILTERS
  // =====================================================

  const [selectedCategory, setSelectedCategory] =
    useState<number | null>(
      urlCategoryId
    );

  const [minPrice, setMinPrice] =
    useState<number | undefined>(
      undefined
    );

  const [maxPrice, setMaxPrice] =
    useState<number | undefined>(
      undefined
    );

  // =====================================================
  // PAGE STATE
  // =====================================================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // KEEP SEARCH IN SYNC WITH URL
  // =====================================================

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  // =====================================================
  // KEEP CATEGORY IN SYNC WITH URL
  // =====================================================

  useEffect(() => {
    setSelectedCategory(
      urlCategoryId
    );
  }, [urlCategoryId]);

  // =====================================================
  // LOAD PRODUCTS + CATEGORIES
  // =====================================================

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          productData,
          categoryData,
        ] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        setProducts(productData);

        setCategories(
          categoryData.filter(
            (category) =>
              category.is_active !== false
          )
        );
      } catch (error) {
        console.error(
          "Products loading error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return products.filter((product) => {
      // =================================================
      // SEARCH
      // =================================================

      const productName =
        product.name.toLowerCase();

      const productDescription =
        product.description
          ?.toLowerCase() || "";

      const matchesSearch =
        !normalizedSearch ||
        productName.includes(
          normalizedSearch
        ) ||
        productDescription.includes(
          normalizedSearch
        );

      // =================================================
      // CATEGORY
      // =================================================

      const matchesCategory =
        selectedCategory === null ||
        product.category_id ===
          selectedCategory;

      // =================================================
      // MIN PRICE
      // =================================================

      const matchesMinPrice =
        minPrice === undefined ||
        product.price >= minPrice;

      // =================================================
      // MAX PRICE
      // =================================================

      const matchesMaxPrice =
        maxPrice === undefined ||
        product.price <= maxPrice;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });
  }, [
    products,
    search,
    selectedCategory,
    minPrice,
    maxPrice,
  ]);

  // =====================================================
  // SELECTED CATEGORY NAME
  // =====================================================

  const selectedCategoryName =
    selectedCategory !== null
      ? categories.find(
          (category) =>
            category.id ===
            selectedCategory
        )?.name
      : undefined;

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setMinPrice(undefined);
    setMaxPrice(undefined);
  };

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
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h1 className="text-xl font-semibold">
            Unable to load products
          </h1>

          <p className="mt-2 text-sm">
            {error}
          </p>
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
          HEADER
      ================================================= */}

      <section className="mb-8">
        <p className="text-sm font-medium text-gray-500">
          ShopSphere
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          {selectedCategoryName
            ? selectedCategoryName
            : search
              ? "Search Results"
              : "All Products"}
        </h1>

        <p className="mt-2 text-gray-500">
          {selectedCategoryName
            ? `Explore products from ${selectedCategoryName}.`
            : search
              ? `Showing products matching "${search}".`
              : "Explore all products available on ShopSphere."}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1
            ? "product"
            : "products"}
        </p>
      </section>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="mb-8">
        <ProductSearch
          onSearch={(value) => {
            setSearch(value);
          }}
        />
      </div>

      {/* =================================================
          FILTERS + PRODUCTS
      ================================================= */}

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">

        {/* =================================================
            FILTERS
        ================================================= */}

        <div>
          <ProductFilters
            categories={categories}
            selectedCategory={
              selectedCategory
            }
            minPrice={minPrice}
            maxPrice={maxPrice}
            onCategoryChange={
              setSelectedCategory
            }
            onPriceChange={(
              min,
              max
            ) => {
              setMinPrice(min);
              setMaxPrice(max);
            }}
            onClear={
              handleClearFilters
            }
          />
        </div>

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <div>
          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border bg-white p-12 text-center">

              <Package className="mx-auto h-12 w-12 text-gray-300" />

              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {selectedCategoryName
                  ? `No products found in ${selectedCategoryName}`
                  : search
                    ? "No matching products found"
                    : "No products found"}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {selectedCategoryName
                  ? `There are currently no products available in ${selectedCategoryName}.`
                  : search
                    ? `No products matched "${search}".`
                    : "There are currently no products available."}
              </p>

              {(search ||
                selectedCategory !== null) && (
                <Link
                  href="/products"
                  className="mt-5 inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  View All Products
                </Link>
              )}

            </div>
          ) : (
            <ProductGrid
              products={filteredProducts}
            />
          )}
        </div>
      </div>
    </main>
  );
}

// =========================================================
// PAGE
// =========================================================

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-gray-500">
              Loading products...
            </p>
          </div>
        </main>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}