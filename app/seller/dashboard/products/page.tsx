"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import Swal from "sweetalert2";

import {
  Edit,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  deleteProduct,
  getMyProducts,
  type Product,
} from "@/services/products";

export default function ManageProductsPage() {
  // =========================================================
  // PRODUCTS
  // =========================================================

  const [products, setProducts] =
    useState<Product[]>([]);

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  async function loadProducts() {
    try {
      setLoading(true);

      const data =
        await getMyProducts();

      setProducts(data);
    } catch (error) {
      console.error(
        "Failed to load products:",
        error
      );

      await Swal.fire(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to load products.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadProducts();
  }, []);

  // =========================================================
  // DELETE / SOFT DELETE
  // =========================================================

  async function handleDelete(
    productId: number
  ) {
    const product =
      products.find(
        (item) =>
          item.id === productId
      );

    if (!product) {
      return;
    }

    const result =
      await Swal.fire({
        icon: "warning",
        title: "Delete Product?",
        text: `Are you sure you want to delete "${product.name}"?`,
        showCancelButton: true,
        confirmButtonText:
          "Yes, Delete",
        cancelButtonText:
          "Cancel",
      });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(productId);

      await deleteProduct(
        productId
      );

      setProducts(
        (previousProducts) =>
          previousProducts.filter(
            (item) =>
              item.id !== productId
          )
      );

      await Swal.fire(
        "Deleted",
        "Product deleted successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      await Swal.fire(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to delete product.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  }

  // =========================================================
  // PRODUCT IMAGE
  // =========================================================

  function getProductImage(
    product: Product
  ) {
    if (
      product.image_url
    ) {
      return product.image_url;
    }

    if (
      product.images &&
      product.images.length > 0
    ) {
      const primaryImage =
        product.images.find(
          (image) =>
            image.is_primary
        );

      return (
        primaryImage?.image_url ||
        product.images[0]
          ?.image_url ||
        null
      );
    }

    return null;
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manage Products
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View and manage all your products.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {/* REFRESH */}

            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>

            {/* ADD PRODUCT */}

            <Link
              href="/seller/dashboard/products/add"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />

              Add Product
            </Link>
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-gray-200 bg-white">

            <div className="text-center">

              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-500" />

              <p className="mt-3 text-sm text-gray-500">
                Loading your products...
              </p>
            </div>
          </div>
        ) : products.length === 0 ? (

          /* =================================================
             NO PRODUCTS
          ================================================= */

          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">

              <ImageIcon className="h-8 w-8 text-gray-400" />

            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-900">
              No Products Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              You have not created any products yet.
              Create your first product to start selling.
            </p>

            <Link
              href="/seller/dashboard/products/add"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />

              Add Your First Product
            </Link>
          </div>
        ) : (

          /* =================================================
             PRODUCTS TABLE
          ================================================= */

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* TABLE HEADER */}

            <div className="border-b border-gray-200 px-6 py-4">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Your Products
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {products.length}{" "}
                    {products.length ===
                    1
                      ? "product"
                      : "products"}
                  </p>
                </div>
              </div>
            </div>

            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto lg:block">

              <table className="w-full">

                <thead className="border-b border-gray-200 bg-gray-50">

                  <tr>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Product
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Price
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Stock
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">

                  {products.map(
                    (product) => {
                      const image =
                        getProductImage(
                          product
                        );

                      return (
                        <tr
                          key={
                            product.id
                          }
                          className="hover:bg-gray-50"
                        >

                          {/* PRODUCT */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-4">

                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">

                                {image ? (
                                  <img
                                    src={
                                      image
                                    }
                                    alt={
                                      product.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}

                              </div>

                              <div className="min-w-0">

                                <p className="truncate font-semibold text-gray-900">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  ID:{" "}
                                  {
                                    product.id
                                  }
                                </p>

                              </div>
                            </div>
                          </td>

                          {/* PRICE */}

                          <td className="px-6 py-4">

                            <p className="font-semibold text-gray-900">
                              ₹
                              {Number(
                                product.price
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>

                            {product.original_price &&
                              product.original_price >
                                product.price && (
                                <p className="mt-1 text-xs text-gray-400 line-through">
                                  ₹
                                  {Number(
                                    product.original_price
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </p>
                              )}
                          </td>

                          {/* STOCK */}

                          <td className="px-6 py-4">

                            <span
                              className={`font-medium ${
                                product.stock >
                                0
                                  ? "text-gray-900"
                                  : "text-red-600"
                              }`}
                            >
                              {
                                product.stock
                              }
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-4">

                            {product.is_active ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                <Eye className="h-3.5 w-3.5" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                <EyeOff className="h-3.5 w-3.5" />
                                Inactive
                              </span>
                            )}

                          </td>

                          {/* ACTIONS */}

                          <td className="px-6 py-4">

                            <div className="flex items-center justify-end gap-2">

                              {/* EDIT */}

                              <Link
                                href={`/seller/dashboard/products/${product.id}/edit`}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </Link>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    product.id
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  product.id
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId ===
                                product.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}

                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="divide-y divide-gray-200 lg:hidden">

              {products.map(
                (product) => {
                  const image =
                    getProductImage(
                      product
                    );

                  return (
                    <div
                      key={
                        product.id
                      }
                      className="p-4"
                    >

                      <div className="flex gap-4">

                        {/* IMAGE */}

                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">

                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={
                                product.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-7 w-7 text-gray-400" />
                            </div>
                          )}

                        </div>

                        {/* INFO */}

                        <div className="min-w-0 flex-1">

                          <h3 className="truncate font-semibold text-gray-900">
                            {
                              product.name
                            }
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            ₹
                            {Number(
                              product.price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Stock:{" "}
                            {
                              product.stock
                            }
                          </p>

                          <div className="mt-2">

                            {product.is_active ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                <Eye className="h-3 w-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                <EyeOff className="h-3 w-3" />
                                Inactive
                              </span>
                            )}

                          </div>
                        </div>
                      </div>

                      {/* MOBILE ACTIONS */}

                      <div className="mt-4 flex gap-2">

                        <Link
                          href={`/seller/dashboard/products/${product.id}/edit`}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              product.id
                            )
                          }
                          disabled={
                            deletingId ===
                            product.id
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId ===
                          product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}

                          Delete
                        </button>

                      </div>
                    </div>
                  );
                }
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}