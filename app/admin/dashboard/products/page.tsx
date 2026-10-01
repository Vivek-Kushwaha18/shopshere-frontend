"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  deleteProduct,
  getProducts,
  type Product,
} from "@/services/products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const result = await getProducts();

        setProducts(result);
      } catch (error) {
        console.error(
          "Admin products error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  async function handleDelete(
    productId: number,
    productName: string
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${productName}"?`
    );

    if (!confirmed) {
      return;
    }

    if (deletingId !== null) {
      return;
    }

    try {
      setDeletingId(productId);
      setError("");

      await deleteProduct(productId);

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product.id !== productId
        )
      );
    } catch (error) {
      console.error(
        "Admin delete product error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-gray-600">
              Loading products...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* =================================================
            BACK
        ================================================== */}

        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        
        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mt-6 rounded-lg border border-black bg-white p-4 text-sm text-black">
            {error}
          </div>
        )}

        {/* =================================================
            COUNT
        ================================================== */}

        <div className="mt-6 rounded-lg border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-600">
            Total Products{" "}
            <span className="font-semibold text-black">
              {products.length}
            </span>
          </p>
        </div>

        {/* =================================================
            EMPTY
        ================================================== */}

        {products.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-12 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
              <Package className="h-8 w-8 text-gray-500" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-black">
              No products found
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              There are currently no active products.
            </p>

          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      Product
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      Seller
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      Price
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      Stock
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      Category
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-semibold text-black">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">

                  {products.map((product) => {

                    const hasDiscount =
                      product.original_price != null &&
                      product.original_price >
                        product.price;

                    const images =
                      product.images ?? [];

                    const primaryImage =
                      product.image ||
                      images.find(
                        (image) =>
                          image.is_primary
                      )?.image_url ||
                      images[0]?.image_url ||
                      null;

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* =================================================
                            PRODUCT
                        ================================================== */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-4">

                            <div className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                              {primaryImage ? (
                                <img
                                  src={primaryImage}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}

                            </div>

                            <div>

                              <p className="font-semibold text-black">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                ID: {product.id}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* =================================================
                            SELLER
                        ================================================== */}

                        <td className="px-6 py-5">

                          <span className="text-sm text-gray-600">
                            Seller ID:{" "}
                            {product.seller_id}
                          </span>

                        </td>

                        {/* =================================================
                            PRICE
                        ================================================== */}

                        <td className="px-6 py-5">

                          <p className="font-semibold text-black">
                            ₹
                            {product.price.toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          {hasDiscount && (
                            <p className="mt-1 text-xs text-gray-400 line-through">
                              ₹
                              {product.original_price!.toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          )}

                        </td>

                        {/* =================================================
                            STOCK
                        ================================================== */}

                        <td className="px-6 py-5">

                          {product.stock > 0 ? (
                            <span className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-black">
                              {product.stock} in stock
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-black bg-black px-3 py-1 text-xs font-medium text-white">
                              Out of stock
                            </span>
                          )}

                        </td>

                        {/* =================================================
                            CATEGORY
                        ================================================== */}

                        <td className="px-6 py-5">

                          <span className="text-sm text-gray-600">
                            Category ID:{" "}
                            {product.category_id}
                          </span>

                        </td>

                        {/* =================================================
                            ACTIONS
                        ================================================== */}

                        <td className="px-6 py-5">

                          <div className="flex items-center justify-end gap-2">

                            {/* EDIT */}

                            <Link
                              href={`/admin/dashboard/products/${product.slug}/edit`}
                              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-black hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  product.id,
                                  product.name
                                )
                              }
                              disabled={
                                deletingId ===
                                product.id
                              }
                              className="inline-flex items-center gap-2 rounded-md border border-black bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />

                              {deletingId ===
                              product.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>
              </table>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}