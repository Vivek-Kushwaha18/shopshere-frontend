"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowRight,
  Package,
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

export default function Home() {
  // null = products are not loaded yet
  // [] = products loaded but no products exist
  const [products, setProducts] =
    useState<Product[] | null>(null);

  const [productsError, setProductsError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setProductsError("");

        const result = await getProducts();

        if (!isMounted) {
          return;
        }

        setProducts(result);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error(
          "Home products error:",
          error
        );

        setProductsError(
          error instanceof Error
            ? error.message
            : "Unable to load products."
        );

        setProducts([]);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 py-16">

        {/* VIEW ALL */}

        <div className="mb-8 flex justify-end">
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

        {/* =================================================
            ERROR
        ================================================== */}

        {productsError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">

            <h2 className="font-semibold">
              Unable to load products
            </h2>

            <p className="mt-2 text-sm">
              {productsError}
            </p>

          </div>
        )}

        {/* =================================================
            EMPTY PRODUCTS
            ONLY SHOW AFTER API HAS FINISHED
        ================================================== */}

        {products !== null &&
          !productsError &&
          products.length === 0 && (
            <div className="rounded-xl border p-10 text-center">

              <Package className="mx-auto h-12 w-12 text-gray-300" />

              <h2 className="mt-4 text-xl font-semibold">
                No products found
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                There are currently no products available.
              </p>

            </div>
          )}

        {/* =================================================
            PRODUCTS
        ================================================== */}

        {products !== null &&
          !productsError &&
          products.length > 0 && (

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

              {products.map((product) => {

                const hasDiscount =
                  product.original_price != null &&
                  product.original_price >
                    product.price;

                const primaryImage =
                  product.image ||
                  product.images?.find(
                    (image) =>
                      image.is_primary
                  )?.image_url ||
                  product.images?.[0]
                    ?.image_url ||
                  null;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group"
                  >

                    <Card className="overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                      {/* PRODUCT IMAGE */}

                      <div className="aspect-square overflow-hidden bg-gray-100">

                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-12 w-12 text-gray-300" />
                          </div>
                        )}

                      </div>

                      {/* PRODUCT DETAILS */}

                      <CardContent className="p-4">

                        <h2 className="line-clamp-2 min-h-[48px] font-semibold">
                          {product.name}
                        </h2>

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

        {/* =================================================
            AI SHOPPING ASSISTANT
            BELOW PRODUCTS
        ================================================== */}

        <div className="mt-16 border-t pt-12">

          <div className="mx-auto max-w-3xl text-center">

            <h2 className="text-3xl font-bold tracking-tight">
              Need help finding something?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Tell our AI shopping assistant what you need
              and let it help you discover the right products.
            </p>

            <div className="mt-6 flex justify-center">

              <Button
                size="lg"
                asChild
              >
                <Link href="/ai-assistant">
                  Ask AI Assistant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

            </div>

          </div>

        </div>

      </section>
    </div>
  );
}