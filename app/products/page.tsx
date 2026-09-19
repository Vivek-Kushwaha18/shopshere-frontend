"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import ProductGrid from "@/components/products/ProductGrid";
import ProductSearch from "@/components/products/ProductSearch";
import ProductFilters from "@/components/products/ProductFilters";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            All Products
          </h1>

          <p className="mt-2 text-muted-foreground">
            Discover products from our marketplace.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <ProductSearch
            onSearch={(value) => setSearch(value)}
          />
        </div>

        {/* Mobile Filter Button */}
        <div className="mb-6 lg:hidden">
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              setShowFilters(!showFilters)
            }
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside
            className={`${
              showFilters ? "block" : "hidden"
            } lg:block`}
          >
            <ProductFilters />
          </aside>

          {/* Products */}
          <section>
            {/* Results Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing products
                </p>

                {search && (
                  <p className="mt-1 text-sm">
                    Search:{" "}
                    <span className="font-medium">
                      {search}
                    </span>
                  </p>
                )}
              </div>

              {/* Sort */}
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                defaultValue="featured"
              >
                <option value="featured">
                  Featured
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="rating">
                  Highest Rated
                </option>

                <option value="newest">
                  Newest
                </option>
              </select>
            </div>

            <ProductGrid />
          </section>
        </div>
      </div>
    </div>
  );
}