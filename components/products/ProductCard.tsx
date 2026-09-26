"use client";

import Link from "next/link";
import { Package } from "lucide-react";

import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const hasDiscount =
    product.original_price !== null &&
    product.original_price !== undefined &&
    product.original_price > product.price;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block"
    >
      <article className="overflow-hidden rounded-xl border bg-white transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
        {/* IMAGE */}

        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
          )}

          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white">
              Sale
            </span>
          )}
        </div>

        {/* CONTENT */}

        <div className="p-4">
          <h2 className="line-clamp-2 min-h-[48px] text-base font-semibold text-gray-900">
            {product.name}
          </h2>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ₹
              {product.price.toLocaleString(
                "en-IN"
              )}
            </span>

            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ₹
                {product.original_price!.toLocaleString(
                  "en-IN"
                )}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm">
            {product.stock > 0 ? (
              <span className="text-green-600">
                In stock
              </span>
            ) : (
              <span className="text-red-600">
                Out of stock
              </span>
            )}
          </p>
        </div>
      </article>
    </Link>
  );
}