"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";

import { getProducts, type Product } from "@/services/products";
import { getCategories, type Category } from "@/services/categories";

function ProductScrollRow({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    setCanScrollLeft(element.scrollLeft > 2);
    setCanScrollRight(maxScrollLeft > 2 && element.scrollLeft < maxScrollLeft - 2);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    updateScrollButtons();
    const observer = new ResizeObserver(updateScrollButtons);
    observer.observe(element);
    for (const child of Array.from(element.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [children, updateScrollButtons]);

  function scrollProducts(direction: "left" | "right") {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollBy({
      left: (direction === "left" ? -1 : 1) * element.clientWidth * 0.75,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button type="button" aria-label="Scroll products left"
          onClick={() => scrollProducts("left")}
          className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-colors hover:bg-gray-100 md:flex">
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div ref={scrollRef} onScroll={updateScrollButtons}
        className="grid grid-flow-col auto-cols-[50%] overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:auto-cols-[33.333%] md:auto-cols-[25%]">
        {children}
      </div>
      {canScrollRight && (
        <button type="button" aria-label="Scroll products right"
          onClick={() => scrollProducts("right")}
          className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-colors hover:bg-gray-100 md:flex">
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);

  useEffect(() => {
    const updateCategoryBar = () => {
      setCategoriesCollapsed(window.scrollY > 60);
    };

    updateCategoryBar();
    window.addEventListener("scroll", updateCategoryBar, { passive: true });

    return () => window.removeEventListener("scroll", updateCategoryBar);
  }, []);

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
        className="group min-w-0 overflow-hidden bg-white transition-colors hover:bg-gray-50"
      >
        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
          className="block p-2 sm:p-3"
        >
          <div className="relative flex h-60 items-center justify-center overflow-hidden rounded-2xl bg-gray-50 sm:h-72 lg:h-80">
            {image ? (
              <img
                src={image}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="block h-full w-full rounded-2xl object-contain transition-transform duration-200 group-hover:scale-[1.03]"
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

        <div className="min-w-0 px-3 pb-4 pt-1 sm:px-4">
          <Link
            href={`/products/${product.slug}`}
            className="block text-sm font-medium leading-5 text-gray-800 hover:text-blue-600 sm:text-base"
          >
            <span className="block truncate">{product.name}</span>
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="rounded-sm bg-green-700 px-1.5 py-0.5 text-xs font-semibold leading-4 text-white">
              {(product.rating ?? 0).toFixed(1)} ★
            </span>

            <span className="text-xs text-gray-500">
              ({product.reviews_count ?? 0})
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-base font-bold text-gray-900 sm:text-lg">
              ₹{product.price.toLocaleString("en-IN")}
            </span>

            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through sm:text-sm">
                ₹{product.original_price!.toLocaleString("en-IN")}
              </span>
            )}

            {hasDiscount && (
              <span className="text-xs font-medium text-green-700 sm:text-sm">
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

  function renderHorizontalRow(rowProducts: Product[], rowId: string) {
    return (
      <ProductScrollRow key={rowId}>
        {rowProducts.map(renderProduct)}
      </ProductScrollRow>
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
    <main className="min-h-screen bg-white">
      <style jsx global>{`
        html {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
      <div className={`sticky top-[60px] z-40 border-b border-gray-200 transition-colors duration-200 ${categoriesCollapsed ? "bg-white/90 backdrop-blur-sm" : "bg-white"}`}>
        <nav
          aria-label="Shop by category"
          className="mx-auto flex max-w-[1680px] items-stretch justify-start gap-2 overflow-x-auto px-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3 sm:px-4"
        >
          {categories
            .filter((category) => category.parent_id === null)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                title={category.name}
                className={`group flex min-w-[85px] max-w-[110px] shrink-0 flex-col items-center justify-center border-b-[3px] border-transparent px-1 text-center transition-[height] duration-200 hover:border-blue-600 ${
                  categoriesCollapsed ? "h-[46px]" : "h-[106px]"
                }`}
              >
                {!categoriesCollapsed && (
                  <div className="mb-1.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
                    {category.icon_url ? (
                      <img
                        src={category.icon_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                )}
                <span className="block w-full truncate text-sm font-medium leading-5 text-gray-900 transition-colors group-hover:text-blue-600">
                  {category.name}
                </span>
              </Link>
            ))}
        </nav>
      </div>
      <div className="w-full bg-white">
        {loading ? (
          <div className="flex min-h-56 items-center justify-center bg-white">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <p className="mt-3 text-sm text-gray-500">
                Loading products...
              </p>
            </div>
          </div>
        ) : productsError ? (
          <div className="bg-white p-8 text-center">
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
          <div className="bg-white p-10 text-center">
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
                className="overflow-hidden bg-white"
              >
                {renderHorizontalRow(
                  rowProducts,
                  `category-${category.id}`
                )}
              </section>
            ))}

            {uncategorizedProducts.length > 0 && (
              <section className="overflow-hidden bg-white">
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
