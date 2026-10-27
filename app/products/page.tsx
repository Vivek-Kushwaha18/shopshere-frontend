
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";

import ProductGrid from "@/components/products/ProductGrid";
import {
  getCategories,
  type Category,
} from "@/services/categories";
import {
  getProducts,
  type Product,
} from "@/services/products";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = (searchParams.get("search") ?? "").trim();

  const searchTerms = useMemo(
    () =>
      searchQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    [searchQuery]
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(20000);
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(20000);

  const [openCategory, setOpenCategory] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);
  const [openDiscount, setOpenDiscount] = useState(true);
  const [openAvailability, setOpenAvailability] = useState(true);

  const [selectedDiscount, setSelectedDiscount] =
    useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const [productsResponse, categoriesResponse] =
          await Promise.all([getProducts(), getCategories()]);

        if (!active) return;

        setProducts(productsResponse);
        setCategories(categoriesResponse);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load products."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const highestProductPrice = useMemo(() => {
    const highestPrice = products.reduce(
      (highest, product) => Math.max(highest, product.price),
      0
    );

    return highestPrice > 0
      ? Math.ceil(highestPrice / 1000) * 1000
      : 20000;
  }, [products]);

  useEffect(() => {
    setMinPrice(0);
    setMaxPrice(highestProductPrice);
    setAppliedMinPrice(0);
    setAppliedMaxPrice(highestProductPrice);
  }, [highestProductPrice]);

  const mainCategories = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            category.parent_id === null && category.is_active
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const normalizedName = (product.name ?? "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ");

      const matchesSearch = searchTerms.every((term) =>
        normalizedName.includes(term)
      );

      const matchesPrice =
        product.price >= appliedMinPrice &&
        product.price <= appliedMaxPrice;

      const matchesStock =
        !inStockOnly || product.stock > 0;

      const matchesDiscount =
        selectedDiscount === null ||
        (product.original_price != null &&
          product.original_price > product.price &&
          ((product.original_price - product.price) /
            product.original_price) *
            100 >=
            selectedDiscount);

      return (
        matchesSearch &&
        matchesPrice &&
        matchesStock &&
        matchesDiscount
      );
    });
  }, [
    products,
    searchTerms,
    appliedMinPrice,
    appliedMaxPrice,
    inStockOnly,
    selectedDiscount,
  ]);

  const minPosition =
    highestProductPrice > 0
      ? (minPrice / highestProductPrice) * 100
      : 0;

  const maxPosition =
    highestProductPrice > 0
      ? (maxPrice / highestProductPrice) * 100
      : 100;

  const hasActiveFilters =
    appliedMinPrice > 0 ||
    appliedMaxPrice < highestProductPrice ||
    selectedDiscount !== null ||
    inStockOnly;

  const handleMinPriceChange = (value: number) => {
    const safeValue = Math.max(
      0,
      Math.min(value, Math.max(0, maxPrice - 1))
    );

    setMinPrice(safeValue);
    setAppliedMinPrice(safeValue);
  };

  const handleMaxPriceChange = (value: number) => {
    const safeValue = Math.min(
      highestProductPrice,
      Math.max(value, minPrice + 1)
    );

    setMaxPrice(safeValue);
    setAppliedMaxPrice(safeValue);
  };

  const applyQuickPriceRange = (range: {
    min: number;
    max: number;
  }) => {
    const maxAllowed = Math.max(1, highestProductPrice);
    const nextMin = Math.min(range.min, maxAllowed - 1);
    const nextMax = Math.min(
      maxAllowed,
      Math.max(range.max, nextMin + 1)
    );

    setMinPrice(nextMin);
    setMaxPrice(nextMax);
    setAppliedMinPrice(nextMin);
    setAppliedMaxPrice(nextMax);
  };

  const clearAllFilters = () => {
    setMinPrice(0);
    setMaxPrice(highestProductPrice);
    setAppliedMinPrice(0);
    setAppliedMaxPrice(highestProductPrice);
    setSelectedDiscount(null);
    setInStockOnly(false);
  };

  const clearSearch = () => {
    router.push("/products");
  };

  const handleCategoryClick = (category: Category) => {
    router.push(`/categories/${category.slug}`);
  };

  const quickPriceRanges = [
    { label: "Under ₹1,000", min: 0, max: 1000 },
    { label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
    { label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
    {
      label: "₹10,000+",
      min: 10000,
      max: highestProductPrice,
    },
  ];

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-8 h-8 w-48 rounded bg-gray-200" />
          <div className="flex gap-6">
            <div className="hidden w-64 shrink-0 rounded-lg border bg-white p-5 lg:block">
              <div className="h-6 rounded bg-gray-200" />
              <div className="mt-6 h-32 rounded bg-gray-200" />
              <div className="mt-6 h-32 rounded bg-gray-200" />
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-lg border"
                  >
                    <div className="aspect-square bg-gray-200" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 rounded bg-gray-200" />
                      <div className="h-4 w-2/3 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">
            Unable to load products
          </h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {searchQuery && (
            <>
              <h1 className="text-xl font-bold text-gray-900">
                Search results for &quot;{searchQuery}&quot;
              </h1>
              <button
                type="button"
                onClick={clearSearch}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            </>
          )}
        </div>

        <p className="text-sm text-gray-500">
          {filteredProducts.length} products
        </p>
      </div>

      <div className="flex items-start gap-6">
        <aside className="sticky top-20 hidden h-fit w-64 shrink-0 lg:block">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-700" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">
                  Filters
                </h2>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  CLEAR ALL
                </button>
              )}
            </div>

            <section className="border-b border-gray-200">
              <button
                type="button"
                onClick={() => setOpenCategory((v) => !v)}
                className="flex min-h-12 w-full items-center justify-between px-5 text-left hover:bg-gray-50"
              >
                <span className="text-sm font-semibold text-gray-900">
                  Category
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    openCategory ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  openCategory ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1 px-3 pb-4">
                    {mainCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryClick(category)}
                        className="group flex w-full items-center justify-between rounded-md px-2 py-2.5 text-left text-sm text-gray-700 transition-all hover:bg-blue-50 hover:pl-4 hover:text-blue-700"
                      >
                        <span>{category.name}</span>
                        <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* AUTOMATIC PRICE FILTER */}
            <section className="border-b border-gray-200">
              <button
                type="button"
                onClick={() => setOpenPrice((v) => !v)}
                className="flex min-h-12 w-full items-center justify-between px-5 text-left hover:bg-gray-50"
              >
                <span className="text-sm font-semibold text-gray-900">
                  Price
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    openPrice ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  openPrice ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5">
                    <div className="mb-5 grid grid-cols-2 gap-2">
                      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          Min
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-800">
                          ₹{minPrice.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          Max
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-800">
                          ₹{maxPrice.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="relative mb-6 h-5">
                      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-200" />
                      <div
                        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-600 transition-all duration-150"
                        style={{
                          left: `${minPosition}%`,
                          width: `${Math.max(0, maxPosition - minPosition)}%`,
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max={highestProductPrice}
                        value={minPrice}
                        onChange={(event) =>
                          handleMinPriceChange(Number(event.target.value))
                        }
                        className="price-slider price-slider-min pointer-events-none absolute left-0 top-0 h-5 w-full appearance-none bg-transparent"
                        aria-label="Minimum price"
                      />
                      <input
                        type="range"
                        min="0"
                        max={highestProductPrice}
                        value={maxPrice}
                        onChange={(event) =>
                          handleMaxPriceChange(Number(event.target.value))
                        }
                        className="price-slider price-slider-max pointer-events-none absolute left-0 top-0 h-5 w-full appearance-none bg-transparent"
                        aria-label="Maximum price"
                      />
                    </div>

                    <div className="space-y-1">
                      {quickPriceRanges.map((range) => {
                        const active =
                          minPrice ===
                            Math.min(
                              range.min,
                              Math.max(0, highestProductPrice - 1)
                            ) &&
                          maxPrice ===
                            Math.min(
                              Math.max(1, highestProductPrice),
                              Math.max(
                                range.max,
                                Math.min(
                                  range.min,
                                  Math.max(0, highestProductPrice - 1)
                                ) + 1
                              )
                            );

                        return (
                          <button
                            key={range.label}
                            type="button"
                            onClick={() => applyQuickPriceRange(range)}
                            className={`flex w-full items-center rounded-md px-2 py-2 text-left text-xs transition-all ${
                              active
                                ? "bg-blue-50 font-semibold text-blue-700"
                                : "text-gray-600 hover:bg-gray-50 hover:pl-3 hover:text-gray-900"
                            }`}
                          >
                            <span
                              className={`mr-2 h-1.5 w-1.5 rounded-full ${
                                active ? "bg-blue-600" : "bg-gray-300"
                              }`}
                            />
                            {range.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-b border-gray-200">
              <button
                type="button"
                onClick={() => setOpenDiscount((v) => !v)}
                className="flex min-h-12 w-full items-center justify-between px-5 text-left hover:bg-gray-50"
              >
                <span className="text-sm font-semibold text-gray-900">
                  Discount
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    openDiscount ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  openDiscount ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1 px-5 pb-4">
                    {[10, 20, 30, 50].map((discount) => {
                      const active = selectedDiscount === discount;
                      return (
                        <button
                          key={discount}
                          type="button"
                          onClick={() =>
                            setSelectedDiscount(active ? null : discount)
                          }
                          className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm ${
                            active
                              ? "bg-blue-50 font-semibold text-blue-700"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                              active ? "border-blue-600" : "border-gray-300"
                            }`}
                          >
                            {active && (
                              <span className="h-2 w-2 rounded-full bg-blue-600" />
                            )}
                          </span>
                          {discount}% or more
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <button
                type="button"
                onClick={() => setOpenAvailability((v) => !v)}
                className="flex min-h-12 w-full items-center justify-between px-5 text-left hover:bg-gray-50"
              >
                <span className="text-sm font-semibold text-gray-900">
                  Availability
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    openAvailability ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  openAvailability
                    ? "grid-rows-[1fr]"
                    : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => setInStockOnly((v) => !v)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          inStockOnly
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {inStockOnly && (
                          <span className="text-[10px] font-bold text-white">
                            ✓
                          </span>
                        )}
                      </span>
                      In Stock
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {appliedMinPrice > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice(0);
                    setAppliedMinPrice(0);
                  }}
                  className="group flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  Min ₹{appliedMinPrice.toLocaleString("en-IN")}
                  <X className="h-3 w-3 transition-transform group-hover:rotate-90" />
                </button>
              )}

              {appliedMaxPrice < highestProductPrice && (
                <button
                  type="button"
                  onClick={() => {
                    setMaxPrice(highestProductPrice);
                    setAppliedMaxPrice(highestProductPrice);
                  }}
                  className="group flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  Max ₹{appliedMaxPrice.toLocaleString("en-IN")}
                  <X className="h-3 w-3 transition-transform group-hover:rotate-90" />
                </button>
              )}

              {selectedDiscount !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedDiscount(null)}
                  className="group flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  {selectedDiscount}%+ off
                  <X className="h-3 w-3 transition-transform group-hover:rotate-90" />
                </button>
              )}

              {inStockOnly && (
                <button
                  type="button"
                  onClick={() => setInStockOnly(false)}
                  className="group flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  In Stock
                  <X className="h-3 w-3 transition-transform group-hover:rotate-90" />
                </button>
              )}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <SlidersHorizontal className="h-6 w-6 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  No products found
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? `No products match "${searchQuery}". Try another search.`
                    : "Try changing your filters."}
                </p>
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="mt-4 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-4 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <ProductGrid products={filteredProducts} />
          )}
        </section>
      </div>

      <style jsx global>{`
        .price-slider::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: white;
          border: 3px solid #2563eb;
          cursor: grab;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
        }

        .price-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        .price-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
        }

        .price-slider::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: white;
          border: 3px solid #2563eb;
          cursor: grab;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
        }

        .price-slider::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </main>
  );
}
