"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ImagePlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  getCategories,
  type Category,
} from "@/services/categories";

import { getAccessToken } from "@/services/auth";

export default function AdminAddProductPage() {
  const router = useRouter();

  // =========================================================
  // FILE INPUT
  // =========================================================

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  // =========================================================
  // PRODUCT FIELDS
  // =========================================================

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] =
    useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] =
    useState("");

  // =========================================================
  // IMAGES
  // =========================================================

  const [selectedImages, setSelectedImages] =
    useState<File[]>([]);

  const [imagePreviews, setImagePreviews] =
    useState<string[]>([]);

  const [primaryImageIndex, setPrimaryImageIndex] =
    useState(0);

  // =========================================================
  // CATEGORIES
  // =========================================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  // =========================================================
  // LOADING / MESSAGE
  // =========================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // LOAD CATEGORIES
  // =========================================================

  useEffect(() => {
    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setError("");

        const result = await getCategories();

        setCategories(
          result.filter(
            (category) =>
              category.is_active !== false
          )
        );
      } catch (error) {
        console.error(
          "Admin categories loading error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load categories."
        );
      } finally {
        setCategoriesLoading(false);
      }
    }

    loadCategories();
  }, []);

  // =========================================================
  // CREATE IMAGE PREVIEWS
  // =========================================================

  useEffect(() => {
    const urls = selectedImages.map(
      (file) => URL.createObjectURL(file)
    );

    setImagePreviews(urls);

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [selectedImages]);

  // =========================================================
  // OPEN FILE PICKER
  // =========================================================

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  // =========================================================
  // SELECT MULTIPLE IMAGES
  // =========================================================

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) {
      return;
    }

    setError("");
    setSuccess("");

    // -------------------------------------------------------
    // MAXIMUM 10 IMAGES
    // -------------------------------------------------------

    if (files.length > 10) {
      setError(
        "You can select a maximum of 10 images."
      );

      event.target.value = "";
      return;
    }

    // -------------------------------------------------------
    // ALLOWED TYPES
    // -------------------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const invalidFile = files.find(
      (file) =>
        !allowedTypes.includes(file.type)
    );

    if (invalidFile) {
      setError(
        `Invalid image: ${invalidFile.name}. Please select JPG, PNG, WEBP, or GIF images.`
      );

      event.target.value = "";
      return;
    }

    // -------------------------------------------------------
    // MAXIMUM 5 MB PER IMAGE
    // -------------------------------------------------------

    const maxSize = 5 * 1024 * 1024;

    const largeFile = files.find(
      (file) => file.size > maxSize
    );

    if (largeFile) {
      setError(
        `${largeFile.name} is larger than 5 MB.`
      );

      event.target.value = "";
      return;
    }

    // -------------------------------------------------------
    // SAVE FILES
    // -------------------------------------------------------

    setSelectedImages(files);

    // First selected image becomes main
    setPrimaryImageIndex(0);

    // Allow selecting the same files again
    event.target.value = "";
  }

  // =========================================================
  // REMOVE ONE IMAGE
  // =========================================================

  function removeImage(index: number) {
    const updatedImages =
      selectedImages.filter(
        (_, imageIndex) =>
          imageIndex !== index
      );

    setSelectedImages(updatedImages);

    // No images left
    if (updatedImages.length === 0) {
      setPrimaryImageIndex(0);
      return;
    }

    // Removed primary image
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
      return;
    }

    // Primary image was after removed image
    if (primaryImageIndex > index) {
      setPrimaryImageIndex(
        primaryImageIndex - 1
      );
    }
  }

  // =========================================================
  // REMOVE ALL IMAGES
  // =========================================================

  function removeAllImages() {
    setSelectedImages([]);
    setPrimaryImageIndex(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // =========================================================
  // SET MAIN IMAGE
  // =========================================================

  function setMainImage(index: number) {
    setPrimaryImageIndex(index);
  }

  // =========================================================
  // CREATE PRODUCT
  // =========================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    // =======================================================
    // IF NO IMAGE:
    // OPEN FILE PICKER
    // =======================================================

    if (selectedImages.length === 0) {
      fileInputRef.current?.click();
      return;
    }

    // =======================================================
    // VALIDATION
    // =======================================================

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
      setError(
        "Price is required."
      );
      return;
    }

    if (!originalPrice) {
      setError(
        "Original price is required."
      );
      return;
    }

    if (!stock) {
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

    // =======================================================
    // IMAGE VALIDATION
    // =======================================================

    if (selectedImages.length === 0) {
      fileInputRef.current?.click();
      return;
    }

    if (
      primaryImageIndex < 0 ||
      primaryImageIndex >=
        selectedImages.length
    ) {
      setError(
        "Please select a valid main image."
      );
      return;
    }

    // =======================================================
    // NUMBER VALIDATION
    // =======================================================

    const priceNumber = Number(price);

    const originalPriceNumber =
      Number(originalPrice);

    const stockNumber = Number(stock);

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

    // =======================================================
    // ACCESS TOKEN
    // =======================================================

    const token = getAccessToken();

    if (!token) {
      setError(
        "You are not logged in. Please login again."
      );
      return;
    }

    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";

      // =====================================================
      // FORM DATA
      // =====================================================

      const formData = new FormData();

      formData.append(
        "name",
        name.trim()
      );

      formData.append(
        "description",
        description.trim()
      );

      formData.append(
        "price",
        String(priceNumber)
      );

      formData.append(
        "original_price",
        String(
          originalPriceNumber
        )
      );

      formData.append(
        "stock",
        String(stockNumber)
      );

      formData.append(
        "category_id",
        String(categoryIdNumber)
      );

      // =====================================================
      // ADD ONE OR MULTIPLE IMAGES
      // IMPORTANT: SAME FIELD NAME "file"
      // =====================================================

      selectedImages.forEach(
        (image) => {
          formData.append(
            "file",
            image
          );
        }
      );

      // =====================================================
      // MAIN IMAGE INDEX
      // =====================================================

      formData.append(
        "primary_image_index",
        String(primaryImageIndex)
      );

      setSuccess(
        "Creating product..."
      );

      // =====================================================
      // ONE CREATE API REQUEST
      // =====================================================

      const response = await fetch(
        `${apiUrl}/api/products/`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const text =
        await response.text();

      let data: any = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        data = {
          detail: text,
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Unable to create product. Status: ${response.status}`
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      setSuccess(
        "Product created successfully."
      );

      // Reset form
      setName("");
      setDescription("");
      setPrice("");
      setOriginalPrice("");
      setStock("");
      setCategoryId("");

      setSelectedImages([]);
      setPrimaryImageIndex(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setTimeout(() => {
        router.push(
          "/admin/dashboard/products"
        );
      }, 700);
    } catch (error) {
      console.error(
        "Admin create product error:",
        error
      );

      setSuccess("");

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create product."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <Link
          href="/admin/dashboard/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        <div className="mt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white">
              <Plus className="h-5 w-5 text-black" />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                ShopSphere Admin
              </p>

              <h1 className="text-2xl font-bold text-black">
                Add Product
              </h1>

              <p className="mt-1 text-sm text-gray-600">
                Create a new product for ShopSphere.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-lg border border-black bg-white p-4 text-sm text-black">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-black">
              {success}
            </div>
          )}

          <div className="space-y-6">

            {/* =================================================
                NAME
            ================================================= */}

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
                placeholder="Enter product name"
                disabled={loading}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
              />
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

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
                placeholder="Enter product description"
                rows={5}
                disabled={loading}
                className="w-full resize-none rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
              />
            </div>

            {/* =================================================
                CATEGORY
            ================================================= */}

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
                disabled={
                  loading ||
                  categoriesLoading
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-black"
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories..."
                    : "Select category"}
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

            {/* =================================================
                PRICE + ORIGINAL PRICE
            ================================================= */}

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
                  placeholder="0"
                  disabled={loading}
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
                  placeholder="0"
                  disabled={loading}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                />
              </div>
            </div>

            {/* =================================================
                STOCK
            ================================================= */}

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
                placeholder="0"
                disabled={loading}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
              />
            </div>

            {/* =================================================
                PRODUCT IMAGES
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Product Images
              </label>

              <p className="mb-4 text-xs text-gray-500">
                Select one or multiple images. Maximum 10
                images, 5 MB per image.
              </p>

              {/* Hidden input */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Choose Photos */}

              <button
                type="button"
                onClick={openFilePicker}
                disabled={loading}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-300 bg-white">
                  <ImagePlus className="h-7 w-7 text-black" />
                </div>

                <p className="mt-4 text-sm font-semibold text-black">
                  Select Product Photos
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Select one or multiple photos at once
                </p>

                <span className="mt-3 rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
                  Choose Photos
                </span>
              </button>

              {/* =================================================
                  SELECTED IMAGE COUNT
              ================================================= */}

              {selectedImages.length > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-black">
                    {selectedImages.length}{" "}
                    {selectedImages.length === 1
                      ? "image"
                      : "images"}{" "}
                    selected
                  </span>

                  <button
                    type="button"
                    onClick={removeAllImages}
                    disabled={loading}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove all
                  </button>
                </div>
              )}

              {/* =================================================
                  IMAGE PREVIEWS
              ================================================= */}

              {selectedImages.length > 0 && (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedImages.map(
                    (image, index) => (
                      <div
                        key={`${image.name}-${index}`}
                        className={`overflow-hidden rounded-xl border ${
                          primaryImageIndex ===
                          index
                            ? "border-black ring-2 ring-black"
                            : "border-gray-200"
                        }`}
                      >
                        {/* Image */}

                        <div className="relative h-56 bg-gray-100">
                          {imagePreviews[
                            index
                          ] && (
                            <img
                              src={
                                imagePreviews[
                                  index
                                ]
                              }
                              alt={
                                image.name
                              }
                              className="h-full w-full object-contain"
                            />
                          )}

                          {/* Main badge */}

                          {primaryImageIndex ===
                            index && (
                            <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                              Main Image
                            </span>
                          )}

                          {/* Remove */}

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                index
                              )
                            }
                            disabled={loading}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-black shadow-sm transition hover:bg-black hover:text-white disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Image details */}

                        <div className="space-y-2 p-4">

                          <p
                            className="truncate text-xs text-gray-500"
                            title={
                              image.name
                            }
                          >
                            {image.name}
                          </p>

                          {/* Set Main */}

                          <button
                            type="button"
                            onClick={() =>
                              setMainImage(
                                index
                              )
                            }
                            disabled={
                              loading ||
                              primaryImageIndex ===
                                index
                            }
                            className={`w-full rounded-md px-3 py-2 text-sm font-medium transition ${
                              primaryImageIndex ===
                              index
                                ? "bg-black text-white"
                                : "border border-gray-300 bg-white text-black hover:border-black"
                            }`}
                          >
                            {primaryImageIndex ===
                            index
                              ? "Main Image"
                              : "Set as Main"}
                          </button>

                          {/* Remove */}

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                index
                              )
                            }
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/admin/dashboard/products"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:border-black"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                loading ||
                categoriesLoading
              }
              className="inline-flex items-center justify-center rounded-md border border-black bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating Product..."
                : selectedImages.length === 0
                  ? "Select Photos"
                  : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}