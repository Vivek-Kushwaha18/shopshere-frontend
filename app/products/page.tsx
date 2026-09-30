"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import Link from "next/link";

import { Package } from "lucide-react";

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
  const router = useRouter();
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
  // null = products are still loading
  // [] = products loaded but there are no products
  // =====================================================

  const [products, setProducts] =
    useState<Product[] | null>(null);

  // =====================================================
  // CATEGORY DATA
  // null = categories are still loading
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
  // LOAD REAL PRODUCTS + CATEGORIES
  // =====================================================

  useEffect(() => {
    let isMounted = true;

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

        if (!isMounted) {
          return;
        }

        setProducts(productData);

        setCategories(
          categoryData.filter(
            (category) =>
              category.is_active !== false
          )
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error(
          "Products loading error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load products."
        );

        // Mark products as finished loading.
        // This prevents the page from staying
        // in the initial null state after an error.
        setProducts([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = useMemo(() => {
    // While products are loading, there should
    // be no filtered result to display.
    if (products === null) {
      return [];
    }

    const normalizedSearch =
      search.trim().toLowerCase();

    return products.filter((product) => {

      // =================================================
      // SEARCH
      // =================================================

      const productName =
        product.name?.toLowerCase() || "";

      const productDescription =
        product.description?.toLowerCase() || "";

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

      // =================================================
      // FINAL RESULT
      // =================================================

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

    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    params.delete("category");

    router.push(
      params.toString()
        ? `/products?${params.toString()}`
        : "/products"
    );
  };

  // =====================================================
  // CATEGORY CHANGE
  // =====================================================

  const handleCategoryChange = (
    categoryId: number | null
  ) => {
    setSelectedCategory(categoryId);

    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    if (categoryId !== null) {
      params.set(
        "category",
        String(categoryId)
      );
    } else {
      params.delete("category");
    }

    router.push(
      params.toString()
        ? `/products?${params.toString()}`
        : "/products"
    );
  };

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
              handleCategoryChange
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

          {/* =================================================
              WAITING FOR API
              Do not show "No products found".
              Keep this area empty until products load.
          ================================================= */}

          {products === null ? null : (

            filteredProducts.length === 0 ? (

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

            )

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
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}