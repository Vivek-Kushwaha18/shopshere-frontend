"use client";

import { useState } from "react";
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

const categories = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Beauty",
];

const ratings = [
  { label: "4★ & above", value: 4 },
  { label: "3★ & above", value: 3 },
  { label: "2★ & above", value: 2 },
];

export default function ProductFilters() {
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>([]);

  const [selectedRating, setSelectedRating] =
    useState<number | null>(null);

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function clearFilters() {
    setSelectedCategories([]);
    setSelectedRating(null);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </CardTitle>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
        >
          Clear
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="mb-4 font-semibold">
            Category
          </h3>

          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category}
                className="flex items-center gap-3"
              >
                <Checkbox
                  id={`category-${category}`}
                  checked={selectedCategories.includes(
                    category
                  )}
                  onCheckedChange={() =>
                    toggleCategory(category)
                  }
                />

                <Label
                  htmlFor={`category-${category}`}
                  className="cursor-pointer font-normal"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price */}
        <div>
          <h3 className="mb-4 font-semibold">
            Price
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline">
              ₹0
            </Button>

            <Button variant="outline">
              ₹5,000+
            </Button>
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <h3 className="mb-4 font-semibold">
            Customer Rating
          </h3>

          <div className="space-y-3">
            {ratings.map((rating) => (
              <div
                key={rating.value}
                className="flex items-center gap-3"
              >
                <Checkbox
                  id={`rating-${rating.value}`}
                  checked={
                    selectedRating === rating.value
                  }
                  onCheckedChange={(checked) => {
                    setSelectedRating(
                      checked
                        ? rating.value
                        : null
                    );
                  }}
                />

                <Label
                  htmlFor={`rating-${rating.value}`}
                  className="cursor-pointer font-normal"
                >
                  {rating.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}