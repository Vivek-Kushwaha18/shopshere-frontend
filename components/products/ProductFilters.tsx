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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

        {/* CATEGORY */}

        <div>
          <h3 className="mb-4 font-semibold">
            Category
          </h3>

          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories available.
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3"
                >
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={
                      selectedCategory ===
                      category.id
                    }
                    onCheckedChange={(checked) => {
                      onCategoryChange(
                        checked
                          ? category.id
                          : null
                      );
                    }}
                  />

                  <Label
                    htmlFor={`category-${category.id}`}
                    className="cursor-pointer font-normal"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* PRICE */}

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
                onPriceChange(0, 5000)
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

        {/* RATING */}

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