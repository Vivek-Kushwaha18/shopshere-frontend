"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Pencil,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  getProduct,
  updateProduct,
  type Product,
} from "@/services/products";

import {
  getCategories,
  type Category,
} from "@/services/categories";

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = Number(params.id);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [originalPrice, setOriginalPrice] =
    useState("");

  const [stock, setStock] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    async function loadProduct() {
      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        setError("Invalid product ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          productResult,
          categoriesResult,
        ] = await Promise.all([
          getProduct(productId),
          getCategories(),
        ]);

        setProduct(productResult);
        setCategories(categoriesResult);

        setName(productResult.name);

        setDescription(
          productResult.description || ""
        );

        setPrice(
          String(productResult.price)
        );

        setOriginalPrice(
          productResult.original_price != null
            ? String(
                productResult.original_price
              )
            : ""
        );

        setStock(
          String(productResult.stock)
        );

        setCategoryId(
          String(
            productResult.category_id
          )
        );
      } catch (error) {
        console.error(
          "Admin edit product loading error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (!description.trim()) {
      setError(
        "Product description is required."
      );
      return;
    }

    if (!price) {
      setError("Price is required.");
      return;
    }

    if (!originalPrice) {
      setError(
        "Original price is required."
      );
      return;
    }

    if (!stock) {
      setError("Stock is required.");
      return;
    }

    if (!categoryId) {
      setError(
        "Please select a category."
      );
      return;
    }

    const priceNumber = Number(price);

    const originalPriceNumber =
      Number(originalPrice);

    const stockNumber =
      Number(stock);

    const categoryIdNumber =
      Number(categoryId);

    if (!Number.isFinite(priceNumber)) {
      setError(
        "Please enter a valid price."
      );
      return;
    }

    if (
      !Number.isFinite(
        originalPriceNumber
      )
    ) {
      setError(
        "Please enter a valid original price."
      );
      return;
    }

    if (!Number.isInteger(stockNumber)) {
      setError(
        "Stock must be a whole number."
      );
      return;
    }

    if (!Number.isInteger(categoryIdNumber)) {
      setError(
        "Please select a valid category."
      );
      return;
    }

    if (priceNumber < 0) {
      setError(
        "Price cannot be negative."
      );
      return;
    }

    if (originalPriceNumber < 0) {
      setError(
        "Original price cannot be negative."
      );
      return;
    }

    if (stockNumber < 0) {
      setError(
        "Stock cannot be negative."
      );
      return;
    }

    try {
      setSaving(true);

      const updatedProduct =
        await updateProduct(
          productId,
          {
            name: name.trim(),
            description:
              description.trim(),
            price: priceNumber,
            original_price:
              originalPriceNumber,
            stock: stockNumber,
            category_id:
              categoryIdNumber,
          }
        );

      setProduct(updatedProduct);

      setSuccess(
        "Product updated successfully."
      );

      setTimeout(() => {
        router.push(
          "/admin/dashboard/products"
        );
      }, 700);
    } catch (error) {
      console.error(
        "Admin update product error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-gray-600">
              Loading product...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10">

          <Link
            href="/admin/dashboard/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>

          <div className="mt-6 rounded-xl border border-black bg-white p-6">
            <h1 className="text-xl font-semibold text-black">
              Unable to load product
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-10">

        <Link
          href="/admin/dashboard/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        <div className="mt-8">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white">
              <Pencil className="h-5 w-5 text-black" />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                ShopSphere Admin
              </p>

              <h1 className="text-2xl font-bold text-black">
                Edit Product
              </h1>

              <p className="mt-1 text-sm text-gray-600">
                Update product information.
              </p>
            </div>

          </div>
        </div>

        {product?.image_url && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-medium text-black">
              Current Product Image
            </p>

            <div className="overflow-hidden rounded-lg bg-gray-50">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-64 w-full object-contain"
              />
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >

          {error && (
            <div className="mb-6 rounded-lg border border-black bg-white p-4 text-sm text-black">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-black">
              {success}
            </div>
          )}

          <div className="space-y-6">

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-black"
              >
                Product Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-black"
              >
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={5}
                disabled={saving}
                className="w-full resize-none rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-black"
              >
                Category
              </label>

              <select
                id="category"
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(
                    event.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-black"
              >
                <option value="">
                  Select category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-medium text-black"
                >
                  Price
                </label>

                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) =>
                    setPrice(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="originalPrice"
                  className="mb-2 block text-sm font-medium text-black"
                >
                  Original Price
                </label>

                <input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalPrice}
                  onChange={(event) =>
                    setOriginalPrice(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                />
              </div>

            </div>

            <div>
              <label
                htmlFor="stock"
                className="mb-2 block text-sm font-medium text-black"
              >
                Stock
              </label>

              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(event) =>
                  setStock(
                    event.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
              />
            </div>

          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/admin/dashboard/products"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:border-black"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md border border-black bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}