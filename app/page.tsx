
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";

import { getProducts, type Product } from "@/services/products";
import { getCategories, type Category } from "@/services/categories";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setProductsError("");

    try {
      const [productResult, categoryResult] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      setProducts(productResult);
      setCategories(
        categoryResult.filter(
          (category) => category.is_active !== false
        )
      );
    } catch (error) {
      console.error("Homepage loading error:", error);
      setProductsError(
        error instanceof Error
          ? error.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  function getProductImage(product: Product): string | null {
    return (
      product.images?.find(
        (image) =>
          image.is_primary && image.variant_id == null
      )?.image_url ||
      product.image ||
      product.images?.find(
        (image) => image.variant_id == null
      )?.image_url ||
      product.images?.[0]?.image_url ||
      null
    );
  }

  function renderProduct(product: Product) {
    const image = getProductImage(product);

    const hasDiscount =
      product.original_price != null &&
      product.original_price > product.price;

    const discount = hasDiscount
      ? Math.round(
          ((product.original_price! - product.price) /
            product.original_price!) *
            100
        )
      : 0;

    return (
      <article
        key={product.id}
        className="group min-w-0 overflow-hidden border-r border-b border-gray-200 bg-white transition-colors hover:bg-gray-50"
      >
        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
          className="block px-1 pt-1 sm:px-1.5 sm:pt-1.5"
        >
          <div className="relative flex h-52 items-center justify-center overflow-hidden bg-white sm:h-60 md:h-64">
            {image ? (
              <img
                src={image}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="block h-full w-full scale-[1.12] object-contain transition-transform duration-200 group-hover:scale-[1.16]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-14 w-14 text-gray-300" />
              </div>
            )}

            {hasDiscount && (
              <span className="absolute left-1 top-1 z-10 rounded-sm bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {discount}% OFF
              </span>
            )}
          </div>
        </Link>

        <div className="min-w-0 px-2 pb-2 pt-1 sm:px-2.5">
          <Link
            href={`/products/${product.slug}`}
            className="block text-[12px] font-medium leading-4 text-gray-800 hover:text-blue-600 sm:text-[13px] sm:leading-[18px]"
          >
            <span className="line-clamp-2">{product.name}</span>
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="rounded-sm bg-green-700 px-1 py-0.5 text-[10px] font-semibold leading-3.5 text-white">
              {(product.rating ?? 0).toFixed(1)} ★
            </span>

            <span className="text-[10px] text-gray-500 sm:text-[11px]">
              ({product.reviews_count ?? 0})
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            <span className="text-[13px] font-bold text-gray-900 sm:text-sm">
              ₹{product.price.toLocaleString("en-IN")}
            </span>

            {hasDiscount && (
              <span className="text-[10px] text-gray-400 line-through sm:text-[11px]">
                ₹{product.original_price!.toLocaleString("en-IN")}
              </span>
            )}

            {hasDiscount && (
              <span className="text-[10px] font-medium text-green-700 sm:text-[11px]">
                {discount}% off
              </span>
            )}
          </div>

          <p
            className={`mt-1 text-[10px] sm:text-[11px] ${
              product.stock > 0 ? "text-gray-500" : "text-red-600"
            }`}
          >
            {product.stock > 0
              ? "In stock"
              : "Currently unavailable"}
          </p>
        </div>
      </article>
    );
  }

  function renderHorizontalRow(
    rowProducts: Product[],
    rowId: string
  ) {
    return (
      <div className="relative">
        <button
          type="button"
          aria-label="Scroll products left"
          onClick={(event) => {
            event.currentTarget.parentElement
              ?.querySelector("[data-product-row]")
              ?.scrollBy({ left: -600, behavior: "smooth" });
          }}
          className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-colors hover:bg-gray-100 md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          key={rowId}
          data-product-row
          className="grid grid-flow-col auto-cols-[50%] overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:auto-cols-[33.333%] md:auto-cols-[25%] lg:auto-cols-[20%] xl:auto-cols-[16.6667%]"
        >
          {rowProducts.map(renderProduct)}
        </div>

        <button
          type="button"
          aria-label="Scroll products right"
          onClick={(event) => {
            event.currentTarget.parentElement
              ?.querySelector("[data-product-row]")
              ?.scrollBy({ left: 600, behavior: "smooth" });
          }}
          className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-colors hover:bg-gray-100 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  const categoryRows = useMemo(() => {
    const productsByCategory = new Map<number, Product[]>();

    for (const product of products) {
      const categoryProducts =
        productsByCategory.get(product.category_id) ?? [];
      categoryProducts.push(product);
      productsByCategory.set(product.category_id, categoryProducts);
    }

    return categories.flatMap((category) => {
      const categoryProducts = productsByCategory.get(category.id);

      return categoryProducts
        ? [{ category, products: categoryProducts }]
        : [];
    });
  }, [categories, products]);

  const categoryIds = useMemo(
    () => new Set(categories.map((category) => category.id)),
    [categories]
  );

  const uncategorizedProducts = useMemo(
    () =>
      products.filter(
        (product) => !categoryIds.has(product.category_id)
      ),
    [categoryIds, products]
  );

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-[1440px] space-y-3 px-2 py-3 sm:px-4 lg:px-5">
        {loading ? (
          <div className="flex min-h-56 items-center justify-center rounded-sm border border-gray-200 bg-white">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <p className="mt-3 text-sm text-gray-500">
                Loading products...
              </p>
            </div>
          </div>
        ) : productsError ? (
          <div className="rounded-sm border border-red-200 bg-white p-8 text-center">
            <p className="font-semibold text-red-700">
              Unable to load products
            </p>

            <p className="mt-2 text-sm text-gray-600">
              {productsError}
            </p>

            <button
              type="button"
              onClick={() => void loadPageData()}
              className="mt-4 rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-sm border border-gray-200 bg-white p-10 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-300" />

            <h2 className="mt-4 text-lg font-semibold text-gray-800">
              No products available
            </h2>
          </div>
        ) : (
          <>
            {categoryRows.map(({ category, products: rowProducts }) => (
              <section
                key={category.id}
                className="overflow-hidden rounded-sm border border-gray-200 bg-white"
              >
                <div className="border-b border-gray-200 px-3 py-3 sm:px-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h2>
                </div>

                {renderHorizontalRow(
                  rowProducts,
                  `category-${category.id}`
                )}
              </section>
            ))}

            {uncategorizedProducts.length > 0 && (
              <section className="overflow-hidden rounded-sm border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-3 py-3 sm:px-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    More Products
                  </h2>
                </div>

                {renderHorizontalRow(
                  uncategorizedProducts,
                  "more-products"
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
