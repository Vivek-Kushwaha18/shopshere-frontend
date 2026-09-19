"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const product = {
  id: 1,
  name: "Wireless Bluetooth Headphones",
  category: "Electronics",
  description:
    "Experience high-quality sound with these wireless Bluetooth headphones. Designed for everyday listening, calls, music, and entertainment.",
  price: 2499,
  originalPrice: 3999,
  rating: 4.5,
  reviews: 128,
  image:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
};

export default function ProductDetailPage() {
  const [quantity, setQuantity] = useState(1);

  const discount = Math.round(
    ((product.originalPrice - product.price) /
      product.originalPrice) *
      100
  );

  function increaseQuantity() {
    setQuantity((current) => current + 1);
  }

  function decreaseQuantity() {
    setQuantity((current) =>
      current > 1 ? current - 1 : 1
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/products"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>

        {/* Product */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Image */}
          <Card className="overflow-hidden">
            <div className="aspect-square bg-muted">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          </Card>

          {/* Details */}
          <div>
            <p className="mb-2 text-sm font-medium text-primary">
              {product.category}
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />

                <span className="ml-1 font-medium">
                  {product.rating}
                </span>
              </div>

              <span className="text-muted-foreground">
                ({product.reviews} reviews)
              </span>
            </div>

            <Separator className="my-6" />

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">
                ₹{product.price.toLocaleString("en-IN")}
              </span>

              <span className="text-lg text-muted-foreground line-through">
                ₹
                {product.originalPrice.toLocaleString(
                  "en-IN"
                )}
              </span>

              <span className="rounded-md bg-green-100 px-2 py-1 text-sm font-medium text-green-700">
                {discount}% OFF
              </span>
            </div>

            {/* Description */}
            <p className="mt-6 leading-7 text-muted-foreground">
              {product.description}
            </p>

            <Separator className="my-6" />

            {/* Quantity */}
            <div>
              <p className="mb-3 font-semibold">
                Quantity
              </p>

              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decreaseQuantity}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="flex h-10 w-12 items-center justify-center border-y text-center font-medium">
                  {quantity}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={increaseQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="flex-1">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="sm:w-14"
              >
                <Heart className="h-5 w-5" />
                <span className="sm:hidden">
                  Add to Wishlist
                </span>
              </Button>
            </div>

            <Button
              size="lg"
              variant="secondary"
              className="mt-3 w-full"
            >
              Buy Now
            </Button>

            {/* Benefits */}
            <Card className="mt-8">
              <CardContent className="space-y-5 p-5">
                <div className="flex gap-4">
                  <Truck className="h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="font-medium">
                      Free Delivery
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Free delivery on eligible orders.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="font-medium">
                      Secure Payment
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Your payment information is protected.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <RotateCcw className="h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="font-medium">
                      Easy Returns
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Simple return process for eligible products.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Information */}
        <Card className="mt-10">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold">
              Product Information
            </h2>

            <Separator className="my-5" />

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  Category
                </p>

                <p className="mt-1 font-medium">
                  {product.category}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Customer Rating
                </p>

                <p className="mt-1 font-medium">
                  {product.rating} / 5
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Reviews
                </p>

                <p className="mt-1 font-medium">
                  {product.reviews}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Availability
                </p>

                <p className="mt-1 font-medium text-green-600">
                  In Stock
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold">
              Customer Reviews
            </h2>

            <Separator className="my-5" />

            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />

              <span className="text-xl font-bold">
                {product.rating}
              </span>

              <span className="text-muted-foreground">
                based on {product.reviews} reviews
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}