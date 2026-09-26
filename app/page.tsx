"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowRight,
  Bot,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  getProducts,
  type Product,
} from "@/services/products";

const features = [
  {
    icon: Bot,
    title: "AI Shopping Assistant",
    description:
      "Find products, compare options and get personalized shopping help.",
  },
  {
    icon: ShoppingBag,
    title: "Everything in One Place",
    description:
      "Discover products from multiple sellers across different categories.",
  },
  {
    icon: Truck,
    title: "Easy Order Tracking",
    description:
      "Track your orders and stay updated from checkout to delivery.",
  },
];

export default function Home() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [productsError, setProductsError] =
    useState("");

  // =====================================================
  // LOAD ALL PRODUCTS
  // =====================================================

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProductsError("");

        const result = await getProducts();

        setProducts(result);
      } catch (error) {
        console.error(
          "Home products error:",
          error
        );

        setProductsError(
          error instanceof Error
            ? error.message
            : "Unable to load products."
        );
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-24 lg:py-32">

          <div className="mx-auto max-w-3xl text-center">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4" />

              <span>
                AI-Powered Smart Shopping
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Shop smarter with{" "}
              <span className="underline decoration-2 underline-offset-8">
                ShopSphere
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Discover products, compare options and get
              personalized recommendations with your AI
              shopping assistant.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

              <Button
                size="lg"
                asChild
              >
                <Link href="/products">
                  Explore Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                asChild
              >
                <Link href="/ai-assistant">
                  <Bot className="mr-2 h-4 w-4" />
                  Ask AI Assistant
                </Link>
              </Button>

            </div>

            {/* SEARCH */}

            <div className="mx-auto mt-10 max-w-xl">
              <form
                action="/products"
                className="flex items-center rounded-lg border bg-background p-1 shadow-sm"
              >
                <Search className="ml-3 h-5 w-5 text-muted-foreground" />

                <input
                  type="text"
                  name="search"
                  placeholder="What are you looking for?"
                  className="h-11 flex-1 bg-transparent px-3 text-sm outline-none"
                />

                <Button type="submit">
                  Search
                </Button>
              </form>
            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          ALL PRODUCTS
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-16">

        <div className="mb-8 flex items-end justify-between">

          <div>
            <p className="text-sm font-medium">
              ShopSphere
            </p>

            <h2 className="mt-1 text-3xl font-bold">
              All Products
            </h2>

            <p className="mt-2 text-muted-foreground">
              Explore all available products.
            </p>
          </div>

          <Button
            variant="ghost"
            asChild
          >
            <Link href="/products">
              View all

              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

        </div>

        {/* LOADING */}

        {loadingProducts && (
          <div className="flex min-h-[250px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Loading products...
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loadingProducts &&
          productsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
              <h3 className="font-semibold">
                Unable to load products
              </h3>

              <p className="mt-2 text-sm">
                {productsError}
              </p>
            </div>
          )}

        {/* EMPTY */}

        {!loadingProducts &&
          !productsError &&
          products.length === 0 && (
            <div className="rounded-xl border p-10 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />

              <h3 className="mt-4 text-xl font-semibold">
                No products found
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                There are currently no products available.
              </p>
            </div>
          )}

        {/* PRODUCTS */}

        {!loadingProducts &&
          !productsError &&
          products.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

              {products.map((product) => {
                const hasDiscount =
                  product.original_price != null &&
                  product.original_price >
                    product.price;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                      {/* IMAGE */}

                      <div className="aspect-square overflow-hidden bg-gray-100">

                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-12 w-12 text-gray-300" />
                          </div>
                        )}

                      </div>

                      {/* DETAILS */}

                      <CardContent className="p-4">

                        <h3 className="line-clamp-2 min-h-[48px] font-semibold">
                          {product.name}
                        </h3>

                        <div className="mt-3 flex items-center gap-2">

                          <span className="text-lg font-bold">
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

                      </CardContent>

                    </Card>
                  </Link>
                );
              })}

            </div>
          )}

      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16">

          <div className="mx-auto mb-10 max-w-2xl text-center">

            <h2 className="text-3xl font-bold">
              A smarter way to shop
            </h2>

            <p className="mt-3 text-muted-foreground">
              ShopSphere combines e-commerce with AI to make
              finding the right products easier.
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card key={feature.title}>
                  <CardContent className="p-6">

                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border bg-background">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="text-lg font-semibold">
                      {feature.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>

                  </CardContent>
                </Card>
              );
            })}

          </div>

        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-20">

        <div className="rounded-2xl border bg-muted/40 px-6 py-12 text-center sm:px-12">

          <Sparkles className="mx-auto h-8 w-8" />

          <h2 className="mt-5 text-3xl font-bold">
            Need help finding something?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tell our AI shopping assistant what you need and
            let it help you discover the right products.
          </p>

          <Button
            className="mt-7"
            size="lg"
            asChild
          >
            <Link href="/ai-assistant">
              Start Shopping with AI
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

        </div>

      </section>

    </div>
  );
}