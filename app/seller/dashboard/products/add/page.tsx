"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

import { apiFetch } from "@/services/api";

import {
  getCategories,
  type Category,
} from "@/services/categories";

export default function AddProductPage() {
  const router = useRouter();

  // =========================================================
  // PRODUCT DATA
  // =========================================================

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // =========================================================
  // IMAGE DATA
  // =========================================================

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] =
    useState(0);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // =========================================================
  // CATEGORY DATA
  // =========================================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  // =========================================================
  // SUBMIT STATE
  // =========================================================

  const [submitting, setSubmitting] =
    useState(false);

  // =========================================================
  // CREATE IMAGE PREVIEWS
  // =========================================================

  useEffect(() => {
    const urls = imageFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imageFiles]);

  // =========================================================
  // LOAD CATEGORIES
  // =========================================================

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);

        const data = await getCategories();

        setCategories(
          data.filter(
            (category) =>
              category.is_active !== false
          )
        );
      } catch (error) {
        console.error(
          "Failed to load categories:",
          error
        );

        await Swal.fire(
          "Error",
          "Unable to load categories.",
          "error"
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  // =========================================================
  // PROCESS SELECTED FILES
  // =========================================================

  const handleSelectedFiles = (
    selectedFiles: File[]
  ) => {
    if (selectedFiles.length === 0) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const maxFileSize =
      5 * 1024 * 1024;

    // =======================================================
    // VALIDATE FILE TYPES
    // =======================================================

    const invalidFile =
      selectedFiles.find(
        (file) =>
          !allowedTypes.includes(file.type)
      );

    if (invalidFile) {
      Swal.fire(
        "Invalid Image",
        `${invalidFile.name} is not a supported image.`,
        "warning"
      );

      return;
    }

    // =======================================================
    // VALIDATE FILE SIZE
    // =======================================================

    const largeFile =
      selectedFiles.find(
        (file) =>
          file.size > maxFileSize
      );

    if (largeFile) {
      Swal.fire(
        "Image Too Large",
        `${largeFile.name} is larger than 5 MB.`,
        "warning"
      );

      return;
    }

    // =======================================================
    // ADD FILES
    // =======================================================

    setImageFiles(
      (previousFiles) => {
        const availableSlots =
          10 - previousFiles.length;

        if (availableSlots <= 0) {
          Swal.fire(
            "Maximum 10 Images",
            "You can upload a maximum of 10 images.",
            "warning"
          );

          return previousFiles;
        }

        const filesToAdd =
          selectedFiles.slice(
            0,
            availableSlots
          );

        if (
          filesToAdd.length <
          selectedFiles.length
        ) {
          Swal.fire(
            "Maximum 10 Images",
            "Only 10 images can be uploaded.",
            "warning"
          );
        }

        return [
          ...previousFiles,
          ...filesToAdd,
        ];
      }
    );

    // =======================================================
    // FIRST IMAGE IS MAIN IMAGE
    // =======================================================

    setPrimaryImageIndex(
      (currentIndex) =>
        imageFiles.length === 0
          ? 0
          : currentIndex
    );
  };

  // =========================================================
  // NORMAL INPUT CHANGE
  // =========================================================

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files || []
      );

    handleSelectedFiles(
      selectedFiles
    );

    // Reset input so the same file
    // can be selected again later.
    event.target.value = "";
  };

  // =========================================================
  // OPEN FILE PICKER
  // =========================================================

  const openFilePicker =
    async () => {
      if (submitting) {
        return;
      }

      try {
        /*
         * Chrome / Chromium modern
         * multi-file picker.
         */
        const picker =
          (
            window as Window & {
              showOpenFilePicker?: (
                options?: {
                  multiple?: boolean;
                  types?: Array<{
                    description: string;
                    accept: Record<
                      string,
                      string[]
                    >;
                  }>;
                  excludeAcceptAllOption?: boolean;
                }
              ) => Promise<
                Array<{
                  getFile: () => Promise<File>;
                }>
              >;
            }
          ).showOpenFilePicker;

        if (
          typeof picker ===
          "function"
        ) {
          const handles =
            await picker({
              multiple: true,
              excludeAcceptAllOption:
                true,
              types: [
                {
                  description:
                    "Product Images",
                  accept: {
                    "image/jpeg": [
                      ".jpg",
                      ".jpeg",
                    ],
                    "image/png": [
                      ".png",
                    ],
                    "image/webp": [
                      ".webp",
                    ],
                    "image/gif": [
                      ".gif",
                    ],
                  },
                },
              ],
            });

          const selectedFiles =
            await Promise.all(
              handles.map(
                (handle) =>
                  handle.getFile()
              )
            );

          handleSelectedFiles(
            selectedFiles
          );

          return;
        }

        /*
         * Fallback for browsers that do
         * not support showOpenFilePicker.
         */
        fileInputRef.current?.click();
      } catch (error) {
        /*
         * User cancelled the picker.
         */
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "File picker error:",
          error
        );

        /*
         * Fallback.
         */
        fileInputRef.current?.click();
      }
    };

  // =========================================================
  // REMOVE ONE IMAGE
  // =========================================================

  const handleRemoveImage = (
    index: number
  ) => {
    const updatedFiles =
      imageFiles.filter(
        (_, fileIndex) =>
          fileIndex !== index
      );

    setImageFiles(updatedFiles);

    // No images remaining.
    if (
      updatedFiles.length === 0
    ) {
      setPrimaryImageIndex(0);
      return;
    }

    // Main image was removed.
    if (
      primaryImageIndex === index
    ) {
      setPrimaryImageIndex(0);
      return;
    }

    // Main image shifted left.
    if (
      primaryImageIndex > index
    ) {
      setPrimaryImageIndex(
        primaryImageIndex - 1
      );
    }
  };

  // =========================================================
  // REMOVE ALL IMAGES
  // =========================================================

  const handleRemoveAllImages =
    () => {
      setImageFiles([]);
      setPreviewUrls([]);
      setPrimaryImageIndex(0);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }
    };

  // =========================================================
  // SET PRIMARY IMAGE
  // =========================================================

  const handleSetPrimaryImage =
    (index: number) => {
      setPrimaryImageIndex(index);
    };

  // =========================================================
  // CREATE PRODUCT
  // =========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // =======================================================
    // IMAGE REQUIRED
    // =======================================================

    if (
      imageFiles.length === 0
    ) {
      await Swal.fire(
        "Product Image Required",
        "Please select at least one product image.",
        "warning"
      );

      openFilePicker();
      return;
    }

    // =======================================================
    // NAME VALIDATION
    // =======================================================

    if (!name.trim()) {
      await Swal.fire(
        "Product Name Required",
        "Please enter a product name.",
        "warning"
      );

      return;
    }

    // =======================================================
    // PRICE VALIDATION
    // =======================================================

    if (
      price === "" ||
      Number(price) < 0
    ) {
      await Swal.fire(
        "Invalid Price",
        "Please enter a valid price.",
        "warning"
      );

      return;
    }

    // =======================================================
    // ORIGINAL PRICE VALIDATION
    // =======================================================

    if (
      originalPrice !== "" &&
      Number(originalPrice) < 0
    ) {
      await Swal.fire(
        "Invalid Original Price",
        "Please enter a valid original price.",
        "warning"
      );

      return;
    }

    // =======================================================
    // STOCK VALIDATION
    // =======================================================

    if (
      stock === "" ||
      Number(stock) < 0
    ) {
      await Swal.fire(
        "Invalid Stock",
        "Please enter a valid stock.",
        "warning"
      );

      return;
    }

    // =======================================================
    // CATEGORY VALIDATION
    // =======================================================

    if (!categoryId) {
      await Swal.fire(
        "Category Required",
        "Please select a category.",
        "warning"
      );

      return;
    }

    // =======================================================
    // FORM DATA
    // =======================================================

    const formData =
      new FormData();

    formData.append(
      "name",
      name.trim()
    );

    if (
      description.trim()
    ) {
      formData.append(
        "description",
        description.trim()
      );
    }

    formData.append(
      "price",
      String(
        Number(price)
      )
    );

    if (
      originalPrice !== ""
    ) {
      formData.append(
        "original_price",
        String(
          Number(
            originalPrice
          )
        )
      );
    }

    formData.append(
      "stock",
      String(
        Number(stock)
      )
    );

    formData.append(
      "category_id",
      categoryId
    );

    // =======================================================
    // ADD ALL IMAGES
    // =======================================================

    imageFiles.forEach(
      (file) => {
        formData.append(
          "file",
          file
        );
      }
    );

    // =======================================================
    // PRIMARY IMAGE
    // =======================================================

    formData.append(
      "primary_image_index",
      String(
        primaryImageIndex
      )
    );

    // =======================================================
    // DEBUG
    // =======================================================

    console.log(
      "Product images:",
      imageFiles
    );

    console.log(
      "Image count:",
      imageFiles.length
    );

    console.log(
      "Primary image index:",
      primaryImageIndex
    );

    // =======================================================
    // API REQUEST
    // =======================================================

    try {
      setSubmitting(true);

      const response =
        await apiFetch(
          "/api/products/",
          {
            method: "POST",
            body: formData,
          }
        );

      // =====================================================
      // API ERROR
      // =====================================================

      if (
        !response.success
      ) {
        const detail =
          response.data?.detail;

        let errorMessage =
          "Unable to create product.";

        if (
          Array.isArray(detail)
        ) {
          errorMessage =
            detail
              .map(
                (
                  item: any
                ) => {
                  const location =
                    Array.isArray(
                      item?.loc
                    )
                      ? item.loc.join(
                          "."
                        )
                      : "";

                  const message =
                    item?.msg ||
                    "Validation error";

                  return location
                    ? `${location}: ${message}`
                    : message;
                }
              )
              .join("\n");
        } else if (
          typeof detail ===
          "string"
        ) {
          errorMessage =
            detail;
        } else if (
          detail
        ) {
          errorMessage =
            detail.message ||
            JSON.stringify(
              detail
            );
        }

        throw new Error(
          errorMessage
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      await Swal.fire({
        icon: "success",
        title: "Product Created",
        text: "Product created successfully.",
        confirmButtonText:
          "OK",
      });

      // =====================================================
      // RESET FORM
      // =====================================================

      setName("");
      setDescription("");
      setPrice("");
      setOriginalPrice("");
      setStock("");
      setCategoryId("");

      setImageFiles([]);
      setPreviewUrls([]);
      setPrimaryImageIndex(0);

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      // =====================================================
      // REDIRECT
      // =====================================================

      router.push(
        "/seller/dashboard/products"
      );
    } catch (error) {
      console.error(
        "Create product error:",
        error
      );

      await Swal.fire(
        "Failed",
        error instanceof Error
          ? error.message
          : "Unable to create product.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Add New Product
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Add product information and photos.
            </p>
          </div>

          <Link
            href="/seller/dashboard/products"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* =================================================
              PRODUCT INFORMATION
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Product Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">

              {/* PRODUCT NAME */}

              <div className="md:col-span-2">

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
                  placeholder="Enter product name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* DESCRIPTION */}

              <div className="md:col-span-2">

                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* PRICE */}

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
                  placeholder="2999"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* ORIGINAL PRICE */}

              <div>

                <label
                  htmlFor="originalPrice"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Original Price
                </label>

                <input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    originalPrice
                  }
                  onChange={(event) =>
                    setOriginalPrice(
                      event.target.value
                    )
                  }
                  placeholder="3999"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
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
                  placeholder="20"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                    loadingCategories
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* =================================================
              PRODUCT IMAGES
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-gray-900">
              Product Images
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select one or multiple photos.
              Maximum 10 photos, 5 MB each.
            </p>

            {/* =================================================
                HIDDEN FILE INPUT
            ================================================= */}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={
                handleImageChange
              }
              className="hidden"
            />

            {/* =================================================
                SELECT PHOTOS BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={
                openFilePicker
              }
              disabled={submitting}
              className="mt-5 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:border-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ImagePlus className="mb-3 h-10 w-10 text-gray-400" />

              <span className="text-sm font-semibold text-gray-800">
                Select Product Photos
              </span>

              <span className="mt-1 text-xs text-gray-500">
                Select one or multiple photos
              </span>

              <span className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
                Choose Photos
              </span>
            </button>

            {/* =================================================
                SELECTED COUNT
            ================================================= */}

            {imageFiles.length > 0 && (
              <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">

                <span className="text-sm font-medium text-gray-700">
                  {imageFiles.length}{" "}
                  {imageFiles.length ===
                  1
                    ? "image"
                    : "images"}{" "}
                  selected
                </span>

                <button
                  type="button"
                  onClick={
                    handleRemoveAllImages
                  }
                  disabled={
                    submitting
                  }
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove all
                </button>
              </div>
            )}

            {/* =================================================
                IMAGE PREVIEWS
            ================================================= */}

            {imageFiles.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {imageFiles.map(
                  (
                    file,
                    index
                  ) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className={`overflow-hidden rounded-xl border ${
                        primaryImageIndex ===
                        index
                          ? "border-black ring-2 ring-black"
                          : "border-gray-200"
                      }`}
                    >

                      {/* IMAGE */}

                      <div className="relative h-52 bg-gray-100">

                        {previewUrls[
                          index
                        ] && (
                          <img
                            src={
                              previewUrls[
                                index
                              ]
                            }
                            alt={
                              file.name
                            }
                            className="h-full w-full object-cover"
                          />
                        )}

                        {/* MAIN IMAGE BADGE */}

                        {primaryImageIndex ===
                          index && (
                          <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                            Main Image
                          </span>
                        )}

                        {/* REMOVE ICON */}

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveImage(
                              index
                            )
                          }
                          disabled={
                            submitting
                          }
                          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* IMAGE ACTIONS */}

                      <div className="space-y-2 p-3">

                        <p
                          className="truncate text-xs text-gray-500"
                          title={
                            file.name
                          }
                        >
                          {
                            file.name
                          }
                        </p>

                        {/* SET MAIN */}

                        <button
                          type="button"
                          onClick={() =>
                            handleSetPrimaryImage(
                              index
                            )
                          }
                          disabled={
                            submitting ||
                            primaryImageIndex ===
                              index
                          }
                          className={`w-full rounded-lg px-3 py-2 text-sm font-medium ${
                            primaryImageIndex ===
                            index
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {primaryImageIndex ===
                          index
                            ? "Main Image"
                            : "Set as Main"}
                        </button>

                        {/* REMOVE */}

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveImage(
                              index
                            )
                          }
                          disabled={
                            submitting
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/seller/dashboard/products"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingCategories
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Product...
                </>
              ) : imageFiles.length ===
                0 ? (
                "Select Photos"
              ) : (
                `Create Product (${imageFiles.length} ${
                  imageFiles.length ===
                  1
                    ? "Image"
                    : "Images"
                })`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}