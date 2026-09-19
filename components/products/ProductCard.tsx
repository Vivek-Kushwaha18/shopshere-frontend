"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Wishlist Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-3 top-3 rounded-full shadow-sm"
        >
          <Heart className="h-4 w-4" />
          <span className="sr-only">
            Add to wishlist
          </span>
        </Button>

        {/* Discount */}
        {product.originalPrice &&
          product.originalPrice > product.price && (
            <span className="absolute left-3 top-3 rounded-full bg-destructive px-2 py-1 text-xs font-medium text-white">
              {Math.round(
                ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100
              )}
              % OFF
            </span>
          )}
      </div>

      {/* Product Information */}
      <CardContent className="p-4">
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          {product.category}
        </p>

        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-2 font-semibold hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>

        {/* Rating */}
        <div className="mt-3 flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

          <span className="text-sm font-medium">
            {product.rating}
          </span>

          <span className="text-sm text-muted-foreground">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xl font-bold">
            ₹{product.price.toLocaleString("en-IN")}
          </span>

          {product.originalPrice &&
            product.originalPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                ₹
                {product.originalPrice.toLocaleString(
                  "en-IN"
                )}
              </span>
            )}
        </div>
      </CardContent>

      {/* Card Footer */}
      <CardFooter className="p-4 pt-0">
        <Button className="w-full">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}