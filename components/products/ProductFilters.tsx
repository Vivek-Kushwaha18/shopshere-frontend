"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { Category } from "@/services/categories";

interface ProductFiltersProps {
  categories?: Category[];
  selectedCategory: number | null;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  onCategoryChange: (
    categoryId: number | null
  ) => void;
  onPriceChange: (
    minPrice: number | undefined,
    maxPrice: number | undefined
  ) => void;
  onClear: () => void;
}

export default function ProductFilters({
  categories = [],
  selectedCategory,
  minPrice,
  maxPrice,
  onCategoryChange,
  onPriceChange,
  onClear,
}: ProductFiltersProps) {
  // =====================================================
  // MAIN CATEGORIES ONLY
  // =====================================================

  const mainCategories = categories
    .filter(
      (category) =>
        category.parent_id === null &&
        category.is_active
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </CardTitle>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
        >
          Clear
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* =================================================
            CATEGORY
        ================================================= */}

        <div>
          <h3 className="mb-4 font-semibold">
            Category
          </h3>

          {mainCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories available.
            </p>
          ) : (
            <div className="space-y-2">
              {mainCategories.map(
                (category) => {
                  const isSelected =
                    selectedCategory ===
                    category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        onCategoryChange(
                          isSelected
                            ? null
                            : category.id
                        )
                      }
                      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-black font-semibold text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* =================================================
            PRICE
        ================================================= */}

        <div>
          <h3 className="mb-4 font-semibold">
            Price
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={
                minPrice === 0 &&
                maxPrice === 5000
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                onPriceChange(
                  0,
                  5000
                )
              }
            >
              ₹0 - ₹5,000
            </Button>

            <Button
              type="button"
              variant={
                minPrice === 5000 &&
                maxPrice === undefined
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                onPriceChange(
                  5000,
                  undefined
                )
              }
            >
              ₹5,000+
            </Button>
          </div>
        </div>

        <Separator />

        {/* =================================================
            RATING
        ================================================= */}

        <div>
          <h3 className="mb-4 font-semibold">
            Customer Rating
          </h3>

          <p className="text-sm text-muted-foreground">
            Rating filters will be available
            when the product review API is
            connected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}