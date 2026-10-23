
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Package,
  Check,
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

const INITIAL_CATEGORY_COUNT = 6;

function getDescendantCategories(
  categoryId: number,
  categories: Category[]
): Category[] {
  const result: Category[] = [];
  const visited = new Set<number>([categoryId]);
  const queue = [categoryId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    const children = categories.filter(
      (category) =>
        category.is_active &&
        Number(category.parent_id) === currentId
    );

    for (const child of children) {
      const childId = Number(child.id);

      if (!visited.has(childId)) {
        visited.add(childId);
        result.push(child);
        queue.push(childId);
      }
    }
  }

  return result;
}

function getAllCategoryIds(
  categoryId: number,
  categories: Category[]
): number[] {
  return [
    categoryId,
    ...getDescendantCategories(categoryId, categories).map(
      (category) => Number(category.id)
    ),
  ];
}

type CategoryItemProps = {
  category: Category;
  categories: Category[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  level?: number;
};

function CategoryItem({
  category,
  categories,
  selectedIds,
  onToggle,
  level = 0,
}: CategoryItemProps) {
  const [expanded, setExpanded] = useState(level === 0);
  const [showAll, setShowAll] = useState(false);

  const children = categories.filter(
    (item) =>
      item.is_active &&
      Number(item.parent_id) === Number(category.id)
  );

  const visibleChildren = showAll
    ? children
    : children.slice(0, INITIAL_CATEGORY_COUNT);

  const checked = selectedIds.includes(Number(category.id));
  const remainingCount = children.length - visibleChildren.length;

  return (
    <div className="w-full">
      <div
        className={`flex min-h-9 items-center gap-2 rounded-md px-2 transition-colors ${
          checked ? "bg-blue-50" : "hover:bg-gray-50"
        }`}
        style={{ paddingLeft: `${8 + level * 12}px` }}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={`Select ${category.name}`}
          onClick={() => onToggle(Number(category.id))}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
            checked
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-gray-300 bg-white hover:border-blue-500"
          }`}
        >
          {checked && <Check size={11} strokeWidth={3} />}
        </button>

        <button
          type="button"
          onClick={() => onToggle(Number(category.id))}
          title={category.name}
          className={`min-w-0 flex-1 truncate py-1 text-left text-[13px] ${
            checked
              ? "font-medium text-blue-700"
              : "text-gray-700 hover:text-gray-950"
          }`}
        >
          {category.name}
        </button>

        {children.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-label={`Toggle ${category.name} subcategories`}
            aria-expanded={expanded}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700"
          >
            {expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        )}
      </div>

      {expanded && children.length > 0 && (
        <div>
          {visibleChildren.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              categories={categories}
              selectedIds={selectedIds}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}

          {children.length > INITIAL_CATEGORY_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="mb-2 ml-9 mt-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              {showAll ? "Show less" : `${remainingCount} MORE`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = String(params.id || "");

  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] =
    useState<Category | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState("");

  // Load the current category and its initial products.
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");
      setSelectedIds([]);
      setSelectedProducts([]);
      setInitialProducts([]);

      try {
        const [productResult, categoryResult] = await Promise.all([
          getProductsByCategory(categorySlug),
          getCategories(),
        ]);

        if (cancelled) return;

        const activeCategories = (
          Array.isArray(categoryResult) ? categoryResult : []
        ).filter((item) => item.is_active);

        setInitialProducts(
          Array.isArray(productResult) ? productResult : []
        );
        setCategories(activeCategories);

        setCurrentCategory(
          activeCategories.find(
            (item) => item.slug === categorySlug
          ) || null
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load category:", err);
        setError("Unable to load products. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (categorySlug) {
      loadData();
    } else {
      setLoading(false);
      setError("Category not found.");
    }

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  // Find the root category for the sidebar.
  const rootCategory = useMemo(() => {
    if (!currentCategory) return null;

    let root = currentCategory;
    const visited = new Set<number>();

    while (
      root.parent_id != null &&
      !visited.has(Number(root.id))
    ) {
      visited.add(Number(root.id));

      const parent = categories.find(
        (item) => Number(item.id) === Number(root.parent_id)
      );

      if (!parent) break;

      root = parent;
    }

    return root;
  }, [currentCategory, categories]);

  // Allow only one selected category.
  // Selecting a different category replaces the previous selection.
  // Clicking the selected category again deselects it.
  function toggleCategory(categoryId: number) {
    setSelectedIds((previous) =>
      previous.includes(categoryId) ? [] : [categoryId]
    );
  }

  // Load products for the selected category and all its descendants.
  useEffect(() => {
    let cancelled = false;

    async function loadSelectedProducts() {
      if (selectedIds.length === 0 || categories.length === 0) {
        setSelectedProducts([]);
        setFilterLoading(false);
        return;
      }

      setFilterLoading(true);
      setError("");

      try {
        const categoryIds = getAllCategoryIds(
          selectedIds[0],
          categories
        );

        const selectedCategories = categoryIds
          .map((id) =>
            categories.find(
              (category) => Number(category.id) === id
            )
          )
          .filter(
            (category): category is Category => Boolean(category)
          );

        const results = await Promise.all(
          selectedCategories.map((category) =>
            getProductsByCategory(category.slug)
          )
        );

        if (cancelled) return;

        const productMap = new Map<number, Product>();

        for (const result of results) {
          if (!Array.isArray(result)) continue;

          for (const product of result) {
            productMap.set(Number(product.id), product);
          }
        }

        setSelectedProducts(Array.from(productMap.values()));
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load selected category products:", err);
        setSelectedProducts([]);
        setError("Unable to load selected category products.");
      } finally {
        if (!cancelled) setFilterLoading(false);
      }
    }

    loadSelectedProducts();

    return () => {
      cancelled = true;
    };
  }, [selectedIds, categories]);

  const displayedProducts =
    selectedIds.length > 0 ? selectedProducts : initialProducts;

  return (
    <main className="min-h-screen bg-gray-50/70">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {/*<Link
          href="/products"
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          All products
        </Link>*/}

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {currentCategory?.name || "Category"}
          </h1>

          {/*<p className="mt-1 text-sm text-gray-500">
            Select a category to view its products and subcategories.
          </p>*/}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-3 border-b border-gray-100 px-2 pb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Categories
              </h2>

              {/*<p className="mt-1 text-xs text-gray-500">
                Select one category at a time
              </p>*/}
            </div>

            {rootCategory ? (
              <CategoryItem
                category={rootCategory}
                categories={categories}
                selectedIds={selectedIds}
                onToggle={toggleCategory}
              />
            ) : (
              <p className="px-2 py-3 text-sm text-gray-500">
                No categories available.
              </p>
            )}
          </aside>

          <section className="min-w-0">
            <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                {selectedIds.length > 0
                  ? "Selected category products"
                  : "All products"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading || filterLoading
                  ? "Loading products..."
                  : `${displayedProducts.length} ${
                      displayedProducts.length === 1
                        ? "product"
                        : "products"
                    } found`}
              </p>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-white p-6 text-center text-sm text-red-600">
                {error}
              </div>
            ) : loading || filterLoading ? (
              <div className="py-12 text-center text-sm text-gray-500">
                Loading products...
              </div>
            ) : displayedProducts.length > 0 ? (
              <ProductGrid products={displayedProducts} />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
                <Package
                  size={28}
                  className="mx-auto text-gray-400"
                />

                <h3 className="mt-3 text-base font-semibold text-gray-900">
                  No products found
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Try selecting another category.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
