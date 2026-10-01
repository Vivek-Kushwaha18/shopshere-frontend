"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  Loader2,
  Trash2,
} from "lucide-react";

import {
  getCategories,
  type Category,
} from "@/services/categories";

import {
  deleteProductImage,
  getProduct,
  setPrimaryProductImage,
  updateProduct,
  type Product,
} from "@/services/products";

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productSlug = String(params.id || "");

  // =========================================================
  // PRODUCT
  // =========================================================

  const [product, setProduct] =
    useState<Product | null>(null);

  // =========================================================
  // PRODUCT FIELDS
  // =========================================================

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

  // =========================================================
  // CATEGORIES
  // =========================================================

  const [categories, setCategories] =
    useState<Category[] | null>(null);

  // =========================================================
  // PAGE STATE
  // =========================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [imageUpdatingId, setImageUpdatingId] =
    useState<number | null>(null);

  // =========================================================
  // MESSAGES
  // =========================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // LOAD PRODUCT + CATEGORIES
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!productSlug) {
        if (!isMounted) {
          return;
        }

        setError("Invalid product slug.");
        setLoading(false);
        setCategories([]);

        return;
      }

      try {
        setError("");

        const [
          productResult,
          categoryResult,
        ] = await Promise.all([
          getProduct(productSlug),
          getCategories(),
        ]);

        if (!isMounted) {
          return;
        }

        setProduct(productResult);

        setCategories(
          categoryResult.filter(
            (category) =>
              category.is_active !== false
          )
        );

        setName(
          productResult.name || ""
        );

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

        setLoading(false);
      } catch (error) {
        console.error(
          "Admin edit product loading error:",
          error
        );

        if (!isMounted) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load product."
        );

        setCategories([]);
        setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [productSlug]);

  // =========================================================
  // SAVE PRODUCT INFORMATION
  // =========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
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

    if (!price.trim()) {
      setError(
        "Price is required."
      );
      return;
    }

    if (!originalPrice.trim()) {
      setError(
        "Original price is required."
      );
      return;
    }

    if (!stock.trim()) {
      setError(
        "Stock is required."
      );
      return;
    }

    if (!categoryId) {
      setError(
        "Please select a category."
      );
      return;
    }

    const priceNumber =
      Number(price);

    const originalPriceNumber =
      Number(originalPrice);

    const stockNumber =
      Number(stock);

    const categoryIdNumber =
      Number(categoryId);

    if (
      !Number.isFinite(
        priceNumber
      )
    ) {
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

    if (
      !Number.isInteger(
        stockNumber
      )
    ) {
      setError(
        "Stock must be a whole number."
      );
      return;
    }

    if (
      !Number.isInteger(
        categoryIdNumber
      )
    ) {
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

    if (
      originalPriceNumber < 0
    ) {
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

    if (!product) {
      setError(
        "Product information is unavailable."
      );
      return;
    }

    try {
      setSaving(true);

      const updatedProduct =
        await updateProduct(
          product.id,
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
            image:
              product.image ??
              null,
          }
        );

      setProduct(
        updatedProduct
      );

      setSuccess(
        "Product information updated successfully."
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
  };

  // =========================================================
  // SET EXISTING PRIMARY IMAGE
  // =========================================================

  const handleSetPrimaryImage = async (
    imageId: number
  ) => {
    if (
      imageUpdatingId !== null ||
      !product
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      setImageUpdatingId(imageId);

      const updatedProduct =
        await setPrimaryProductImage(
          product.id,
          imageId
        );

      setProduct(
        updatedProduct
      );

      setSuccess(
        "Main image updated successfully."
      );
    } catch (error) {
      console.error(
        "Set primary image error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to change main image."
      );
    } finally {
      setImageUpdatingId(null);
    }
  };

  // =========================================================
  // DELETE EXISTING IMAGE
  // =========================================================

  const handleDeleteExistingImage =
    async (
      imageId: number
    ) => {
      if (
        imageUpdatingId !== null ||
        !product
      ) {
        return;
      }

      const currentImages =
        product.images ?? [];

      if (currentImages.length <= 1) {
        await Swal.fire(
          "Cannot Delete",
          "A product must have at least one image.",
          "warning"
        );

        return;
      }

      const result =
        await Swal.fire({
          icon: "warning",
          title: "Delete Image?",
          text: "This image will be permanently removed from the product.",
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
        setError("");
        setSuccess("");
        setImageUpdatingId(imageId);

        await deleteProductImage(
          product.id,
          imageId
        );

        const updatedProduct =
          await getProduct(
            product.slug
          );

        setProduct(
          updatedProduct
        );

        setSuccess(
          "Product image deleted successfully."
        );
      } catch (error) {
        console.error(
          "Delete product image error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to delete product image."
        );
      } finally {
        setImageUpdatingId(null);
      }
    };

  // =========================================================
  // WAIT FOR INITIAL DATA
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-5xl px-4 py-10">

          <div className="flex min-h-[300px] items-center justify-center">

            <div className="text-center">

              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-500" />

              <p className="mt-3 text-sm text-gray-500">
                Loading product...
              </p>

            </div>

          </div>

        </div>

      </main>
    );
  }

  // =========================================================
  // ERROR WITHOUT PRODUCT
  // =========================================================

  if (error && !product) {
    return (
      <main className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-5xl px-4 py-10">

          <Link
            href="/admin/dashboard/products"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">

            <h1 className="text-xl font-semibold text-red-700">
              Unable to load product
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

          </div>

        </div>

      </main>
    );
  }

  // =========================================================
  // EXISTING IMAGES
  // =========================================================

  const existingImages =
    product?.images ?? [];

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">

      <div className="mx-auto max-w-5xl">

        {/* BACK BUTTON */}

        <div className="mb-5">

          <Link
            href="/admin/dashboard/products"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* =================================================
            CURRENT PRODUCT IMAGES
        ================================================= */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Current Product Images
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Set the main image or remove an existing image.
              </p>

            </div>

            <span className="text-sm text-gray-500">
              {existingImages.length}{" "}
              {existingImages.length === 1
                ? "image"
                : "images"}
            </span>

          </div>

          {existingImages.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">

              <p className="text-sm text-gray-500">
                No existing product images.
              </p>

            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

              {existingImages.map(
                (image) => (
                  <div
                    key={image.id}
                    className={`overflow-hidden rounded-xl border ${
                      image.is_primary
                        ? "border-black ring-2 ring-black"
                        : "border-gray-200"
                    }`}
                  >

                    {/* IMAGE */}

                    <div className="relative aspect-square bg-gray-100">

                      <img
                        src={image.image_url}
                        alt={
                          product?.name ||
                          "Product image"
                        }
                        className="h-full w-full object-cover"
                      />

                      {image.is_primary && (
                        <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                          Main Image
                        </span>
                      )}

                    </div>

                    {/* ACTIONS */}

                    <div className="space-y-2 p-3">

                      <button
                        type="button"
                        onClick={() =>
                          handleSetPrimaryImage(
                            image.id
                          )
                        }
                        disabled={
                          imageUpdatingId !==
                            null ||
                          image.is_primary
                        }
                        className={`w-full rounded-lg px-3 py-2 text-sm font-medium ${
                          image.is_primary
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {imageUpdatingId ===
                        image.id
                          ? "Updating..."
                          : image.is_primary
                            ? "Main Image"
                            : "Set as Main"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExistingImage(
                            image.id
                          )
                        }
                        disabled={
                          imageUpdatingId !==
                          null
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        {/* =================================================
            PRODUCT INFORMATION
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >

          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Product Information
          </h2>

          <div className="space-y-6">

            {/* PRODUCT NAME */}

            <div>

              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Product Name *
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />

            </div>

            {/* DESCRIPTION */}

            <div>

              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description *
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
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />

            </div>

            {/* CATEGORY */}

            <div>

              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Category *
              </label>

              <select
                id="category"
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(
                    event.target.value
                  )
                }
                disabled={
                  saving ||
                  categories === null
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              >

                <option value="">
                  {categories === null
                    ? "Loading categories..."
                    : "Select category"}
                </option>

                {categories?.map(
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

            {/* PRICE + ORIGINAL PRICE */}

            <div className="grid gap-6 sm:grid-cols-2">

              <div>

                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Price *
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />

              </div>

              <div>

                <label
                  htmlFor="originalPrice"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Original Price *
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />

              </div>

            </div>

            {/* STOCK */}

            <div>

              <label
                htmlFor="stock"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Stock *
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />

            </div>

          </div>

          {/* BUTTONS */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/admin/dashboard/products"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving ||
                categories === null
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}

            </button>

          </div>

        </form>

      </div>

    </main>
  );
}