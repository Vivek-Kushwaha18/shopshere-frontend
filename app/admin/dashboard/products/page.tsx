
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  deleteProduct,
  getProducts,
  type Product,
} from "@/services/products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const result =
          await getProducts();

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
          (product) =>
            product.id !== productId
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

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* Back */}
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              ShopSphere Admin
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-black">
              Products
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Manage all products across ShopSphere.
            </p>
          </div>

          <Link
            href="/admin/dashboard/products/add"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-black bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg border border-black bg-white p-4 text-sm text-black">
            {error}
          </div>
        )}

        {/* Count */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-600">
            Total Products{" "}
            <span className="font-semibold text-black">
              {products.length}
            </span>
          </p>
        </div>

        {/* Empty */}
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

            <Link
              href="/admin/dashboard/products/add"
              className="mt-6 inline-flex items-center gap-2 rounded-md border border-black bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
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
                      product.original_price !=
                        null &&
                      product.original_price >
                        product.price;

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* Product */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">

                            <div className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                              {product.image_url ? (
                                <img
                                  src={
                                    product.image_url
                                  }
                                  alt={
                                    product.name
                                  }
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

                        {/* Seller */}
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-600">
                            Seller ID:{" "}
                            {product.seller_id}
                          </span>
                        </td>

                        {/* Price */}
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

                        {/* Stock */}
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

                        {/* Category */}
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-600">
                            Category ID:{" "}
                            {product.category_id}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">

                            <Link
                              href={`/admin/dashboard/products/${product.id}/edit`}
                              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-black hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>

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
