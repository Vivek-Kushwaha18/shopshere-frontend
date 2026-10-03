"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Package,
  Save,
  Boxes,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import {
  getMyProducts,
  updateProductStock,
  type Product,
} from "@/services/products";

function getStockStatus(stock: number) {
  if (stock === 0) {
    return {
      label: "Out of Stock",
      className: "bg-red-100 text-red-800",
    };
  }

  if (stock <= 5) {
    return {
      label: "Low Stock",
      className: "bg-yellow-100 text-yellow-800",
    };
  }

  return {
    label: "In Stock",
    className: "bg-green-100 text-green-800",
  };
}

export default function SellerInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockValues, setStockValues] = useState<Record<number, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(
    null
  );

  async function loadProducts() {
    try {
      setLoading(true);

      const data = await getMyProducts();

      setProducts(data);

      const initialStock: Record<number, string> = {};

      data.forEach((product) => {
        initialStock[product.id] = String(product.stock);
      });

      setStockValues(initialStock);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load inventory",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleStockChange(productId: number, value: string) {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setStockValues((current) => ({
      ...current,
      [productId]: value,
    }));
  }

  async function handleUpdateStock(productId: number) {
    const value = stockValues[productId];

    if (value === undefined || value === "") {
      Swal.fire({
        icon: "warning",
        title: "Invalid stock",
        text: "Please enter a stock quantity.",
      });

      return;
    }

    const stock = Number(value);

    if (!Number.isInteger(stock) || stock < 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid stock",
        text: "Stock must be a whole number greater than or equal to 0.",
      });

      return;
    }

    try {
      setUpdatingProductId(productId);

      const updatedProduct = await updateProductStock(
        productId,
        stock
      );

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === productId
            ? updatedProduct
            : product
        )
      );

      setStockValues((current) => ({
        ...current,
        [productId]: String(updatedProduct.stock),
      }));

      Swal.fire({
        icon: "success",
        title: "Stock updated",
        text: "Product stock has been updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text:
          error instanceof Error
            ? error.message
            : "Unable to update stock.",
      });
    } finally {
      setUpdatingProductId(null);
    }
  }

  const totalProducts = products.length;

  const inStockProducts = products.filter(
    (product) => product.stock > 5
  ).length;

  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 5
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.stock === 0
  ).length;

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">
          Inventory
        </h1>

        <p className="mt-4 text-gray-500">
          Loading inventory...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* PAGE HEADER */}

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6" />

          <h1 className="text-2xl font-semibold">
            Inventory
          </h1>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Manage stock for your products.
        </p>
      </div>

      {/* INVENTORY SUMMARY */}

      {products.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Products
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {totalProducts}
                </p>
              </div>

              <div className="rounded-full bg-gray-100 p-3">
                <Boxes className="h-5 w-5 text-gray-700" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  In Stock
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {inStockProducts}
                </p>
              </div>

              <div className="rounded-full bg-green-100 p-3">
                <Package className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Low Stock
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {lowStockProducts}
                </p>
              </div>

              <div className="rounded-full bg-yellow-100 p-3">
                <AlertTriangle className="h-5 w-5 text-yellow-700" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Out of Stock
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {outOfStockProducts}
                </p>
              </div>

              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-5 w-5 text-red-700" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS */}

      {products.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <h2 className="text-lg font-medium">
            No products found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Your products will appear here once you add them.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-4 font-medium">
                  Product
                </th>

                <th className="px-4 py-4 font-medium">
                  Price
                </th>

                <th className="px-4 py-4 font-medium">
                  Current Stock
                </th>

                <th className="px-4 py-4 font-medium">
                  Status
                </th>

                <th className="px-4 py-4 font-medium">
                  Update Stock
                </th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const stockStatus = getStockStatus(
                  product.stock
                );

                const isUpdating =
                  updatingProductId === product.id;

                return (
                  <tr
                    key={product.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-14 w-14 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">
                            No image
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Product #{product.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      ₹{product.price.toFixed(2)}
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-medium">
                        {product.stock}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${stockStatus.className}`}
                      >
                        {stockStatus.label}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            stockValues[product.id] ?? ""
                          }
                          onChange={(event) =>
                            handleStockChange(
                              product.id,
                              event.target.value
                            )
                          }
                          disabled={isUpdating}
                          className="w-24 rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStock(product.id)
                          }
                          disabled={isUpdating}
                          className="inline-flex items-center gap-2 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />

                          {isUpdating
                            ? "Saving..."
                            : "Save"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}