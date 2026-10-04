"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Package,
  Trash2,
} from "lucide-react";
import Swal from "sweetalert2";

import {
  getWishlist,
  removeFromWishlist,
  type WishlistItem,
} from "@/services/wishlist";

export default function WishlistPage() {
  const [items, setItems] =
    useState<WishlistItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [removingId, setRemovingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD WISHLIST
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    async function loadWishlist() {
      try {
        setLoading(true);
        setError("");

        const wishlist =
          await getWishlist();

        if (isMounted) {
          setItems(wishlist);
        }
      } catch (error) {
        console.error(
          "Wishlist loading error:",
          error
        );

        if (isMounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load wishlist."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadWishlist();

    return () => {
      isMounted = false;
    };
  }, []);

  // =====================================================
  // REMOVE FROM WISHLIST
  // =====================================================

  async function handleRemove(
    productId: number
  ) {
    try {
      setRemovingId(productId);
      setError("");

      await removeFromWishlist(
        productId
      );

      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            item.product_id !==
            productId
        )
      );

      await Swal.fire({
        icon: "success",
        title: "Removed",
        text: "Product removed from your wishlist.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "Remove wishlist error:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Unable to remove",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });
    } finally {
      setRemovingId(null);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10">

          <h1 className="text-3xl font-bold">
            My Wishlist
          </h1>

          <div className="mt-8 flex min-h-[300px] items-center justify-center">
            <p className="text-gray-500">
              Loading wishlist...
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">

      <div className="mx-auto max-w-6xl px-4 py-10">

        {/* PAGE HEADER */}

        <div className="mb-8">

          <div className="flex items-center gap-3">

            <Heart className="h-7 w-7 text-red-500" />

            <h1 className="text-3xl font-bold">
              My Wishlist
            </h1>

          </div>

          <p className="mt-2 text-muted-foreground">
            Products you have saved for later.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* EMPTY WISHLIST */}

        {items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">

            <Heart className="mx-auto h-16 w-16 text-gray-300" />

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              Your wishlist is empty
            </h2>

            <p className="mt-2 text-gray-500">
              Save products you love and find them here later.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Continue Shopping
            </Link>

          </div>
        ) : (

          /* WISHLIST PRODUCTS */

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {items.map((item) => {

              const product =
                item.product;

              const hasDiscount =
                product.original_price != null &&
                product.original_price >
                  product.price;

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-xl border bg-white"
                >

                  {/* PRODUCT IMAGE */}

                  <Link
                    href={`/products/${product.slug}`}
                    className="group block"
                  >

                    <div className="relative aspect-square overflow-hidden bg-gray-100">

                      {product.image_url ? (
                        <img
                          src={
                            product.image_url
                          }
                          alt={
                            product.name
                          }
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

                  </Link>

                  {/* PRODUCT DETAILS */}

                  <div className="p-4">

                    <Link
                      href={`/products/${product.slug}`}
                    >
                      <h2 className="line-clamp-2 min-h-[48px] text-base font-semibold text-gray-900 hover:text-primary">
                        {product.name}
                      </h2>
                    </Link>

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

                    {/* REMOVE BUTTON */}

                    <button
                      type="button"
                      onClick={() =>
                        handleRemove(
                          product.id
                        )
                      }
                      disabled={
                        removingId ===
                        product.id
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      <Trash2 className="h-4 w-4" />

                      {removingId ===
                      product.id
                        ? "Removing..."
                        : "Remove"}

                    </button>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}