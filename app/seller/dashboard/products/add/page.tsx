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
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  getCategories,
  type Category,
} from "@/services/categories";

import {
  createProduct,
} from "@/services/products";

import {
  createProductOption,
} from "@/services/product-options";

import {
  createProductVariant,
} from "@/services/product-variants";

import {
  uploadProductVariantImage,
  setProductVariantPrimaryImage,
} from "@/services/product-variant-images";

// =====================================================
// TYPES
// =====================================================

interface OptionValueInput {
  id: string;
  value: string;
}

interface OptionGroupInput {
  id: string;
  name: string;
  values: OptionValueInput[];
}

interface VariantImageInput {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
  viewType: string;
}

interface VariantInput {
  id: string;

  // Temporary frontend IDs.
  // These are converted to real database IDs during submit.
  optionValueIds: string[];

  optionLabels: string[];
  sku: string;
  price: string;
  originalPrice: string;
  stock: string;
  images: VariantImageInput[];
}

// =====================================================
// HELPERS
// =====================================================

function createTemporaryId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function generateCombinations(
  groups: OptionGroupInput[]
): OptionValueInput[][] {
  if (groups.length === 0) {
    return [];
  }

  const validGroups = groups.filter(
    (group) =>
      group.name.trim() &&
      group.values.some(
        (value) => value.value.trim()
      )
  );

  if (validGroups.length === 0) {
    return [];
  }

  let combinations: OptionValueInput[][] = [
    [],
  ];

  for (const group of validGroups) {
    const values = group.values.filter(
      (value) => value.value.trim()
    );

    const next: OptionValueInput[][] = [];

    for (const combination of combinations) {
      for (const value of values) {
        next.push([
          ...combination,
          value,
        ]);
      }
    }

    combinations = next;
  }

  return combinations;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AddProductPage() {
  const router = useRouter();

  // =====================================================
  // PRODUCT DATA
  // =====================================================

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] =
    useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] =
    useState("");

  // =====================================================
  // PRODUCT IMAGE DATA
  // =====================================================

  const [imageFiles, setImageFiles] =
    useState<File[]>([]);

  const [previewUrls, setPreviewUrls] =
    useState<string[]>([]);

  const [primaryImageIndex, setPrimaryImageIndex] =
    useState(0);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // =====================================================
  // VARIANT MODE
  // =====================================================

  const [hasVariants, setHasVariants] =
    useState(false);

  // =====================================================
  // OPTION GROUPS
  // =====================================================

  const [optionGroups, setOptionGroups] =
    useState<OptionGroupInput[]>([]);

  // =====================================================
  // VARIANTS
  // =====================================================

  const [variants, setVariants] =
    useState<VariantInput[]>([]);

  // =====================================================
  // CATEGORIES
  // =====================================================

  const [categories, setCategories] =
    useState<Category[] | null>(null);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  /*
   * Stores the selected category at every level.
   *
   * Example:
   *
   * [
   *   "1",   // Electronics
   *   "5",   // Mobile Phones
   *   "12"   // Android Phones
   * ]
   *
   * The last ID is always copied to categoryId.
   */
  const [selectedCategoryPath, setSelectedCategoryPath] =
    useState<string[]>([]);

  // =====================================================
  // SUBMIT
  // =====================================================

  const [submitting, setSubmitting] =
    useState(false);

  // =====================================================
  // PRODUCT IMAGE PREVIEWS
  // =====================================================

  useEffect(() => {
    const urls = imageFiles.map(
      (file) =>
        URL.createObjectURL(file)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imageFiles]);

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        setLoadingCategories(true);

        const data =
          await getCategories();

        if (!mounted) {
          return;
        }

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

        if (mounted) {
          setCategories([]);

          await Swal.fire(
            "Error",
            "Unable to load categories.",
            "error"
          );
        }
      } finally {
        if (mounted) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // CATEGORY HELPERS
  // =====================================================

  function getCategoryChildren(
    parentId: number | null
  ): Category[] {
    if (!categories) {
      return [];
    }

    return categories
      .filter(
        (category) =>
          category.parent_id === parentId
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  }

  function getCategoryById(
    id: string
  ): Category | undefined {
    if (!categories) {
      return undefined;
    }

    return categories.find(
      (category) =>
        String(category.id) === id
    );
  }

  function handleCategoryChange(
    level: number,
    value: string
  ) {
    if (!value) {
      const updatedPath =
        selectedCategoryPath.slice(
          0,
          level
        );

      setSelectedCategoryPath(
        updatedPath
      );

      setCategoryId(
        updatedPath.length > 0
          ? updatedPath[
              updatedPath.length - 1
            ]
          : ""
      );

      return;
    }

    const updatedPath =
      selectedCategoryPath.slice(
        0,
        level
      );

    updatedPath[level] = value;

    setSelectedCategoryPath(
      updatedPath
    );

    /*
     * The final selected category is
     * always the last selected category.
     */
    setCategoryId(value);
  }

  function getCategoryOptionsForLevel(
    level: number
  ): Category[] {
    if (level === 0) {
      return getCategoryChildren(null);
    }

    const parentId =
      selectedCategoryPath[level - 1];

    if (!parentId) {
      return [];
    }

    return getCategoryChildren(
      Number(parentId)
    );
  }

  // =====================================================
  // PRODUCT IMAGE PICKER
  // =====================================================

  function openFilePicker() {
    if (submitting) {
      return;
    }

    fileInputRef.current?.click();
  }

  // =====================================================
  // PRODUCT IMAGE SELECTION
  // =====================================================

  function handleSelectedFiles(
    selectedFiles: File[]
  ) {
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

    const availableSlots =
      10 - imageFiles.length;

    if (availableSlots <= 0) {
      Swal.fire(
        "Maximum 10 Images",
        "You can upload a maximum of 10 images.",
        "warning"
      );

      return;
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
        "Only 10 images can be uploaded for the product.",
        "warning"
      );
    }

    const invalidFile =
      filesToAdd.find(
        (file) =>
          !allowedTypes.includes(
            file.type
          )
      );

    if (invalidFile) {
      Swal.fire(
        "Invalid Image",
        `${invalidFile.name} is not a supported image.`,
        "warning"
      );

      return;
    }

    const largeFile =
      filesToAdd.find(
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

    const newFiles =
      filesToAdd.filter(
        (newFile) =>
          !imageFiles.some(
            (existingFile) =>
              existingFile.name ===
                newFile.name &&
              existingFile.size ===
                newFile.size &&
              existingFile.lastModified ===
                newFile.lastModified
          )
      );

    if (newFiles.length === 0) {
      Swal.fire(
        "Images Already Selected",
        "The selected images are already in the product gallery.",
        "info"
      );

      return;
    }

    setImageFiles(
      (previous) => [
        ...previous,
        ...newFiles,
      ]
    );

    if (imageFiles.length === 0) {
      setPrimaryImageIndex(0);
    }
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    handleSelectedFiles(files);

    event.target.value = "";
  }

  // =====================================================
  // REMOVE PRODUCT IMAGE
  // =====================================================

  function handleRemoveImage(
    index: number
  ) {
    const updatedFiles =
      imageFiles.filter(
        (_, fileIndex) =>
          fileIndex !== index
      );

    setImageFiles(updatedFiles);

    if (updatedFiles.length === 0) {
      setPrimaryImageIndex(0);
      return;
    }

    if (
      primaryImageIndex === index
    ) {
      setPrimaryImageIndex(0);
      return;
    }

    if (
      primaryImageIndex > index
    ) {
      setPrimaryImageIndex(
        primaryImageIndex - 1
      );
    }
  }

  // =====================================================
  // REMOVE ALL PRODUCT IMAGES
  // =====================================================

  function handleRemoveAllImages() {
    setImageFiles([]);
    setPreviewUrls([]);
    setPrimaryImageIndex(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // =====================================================
  // OPTION GROUP
  // =====================================================

  function addOptionGroup() {
    setOptionGroups(
      (previous) => [
        ...previous,
        {
          id: createTemporaryId(),
          name: "",
          values: [
            {
              id: createTemporaryId(),
              value: "",
            },
          ],
        },
      ]
    );
  }

  function removeOptionGroup(
    groupId: string
  ) {
    setOptionGroups(
      (previous) =>
        previous.filter(
          (group) =>
            group.id !== groupId
        )
    );

    setVariants([]);
  }

  function updateOptionGroupName(
    groupId: string,
    value: string
  ) {
    setOptionGroups(
      (previous) =>
        previous.map(
          (group) =>
            group.id === groupId
              ? {
                  ...group,
                  name: value,
                }
              : group
        )
    );
  }

  // =====================================================
  // OPTION VALUE
  // =====================================================

  function addOptionValue(
    groupId: string
  ) {
    setOptionGroups(
      (previous) =>
        previous.map(
          (group) =>
            group.id === groupId
              ? {
                  ...group,
                  values: [
                    ...group.values,
                    {
                      id: createTemporaryId(),
                      value: "",
                    },
                  ],
                }
              : group
        )
    );

    setVariants([]);
  }

  function removeOptionValue(
    groupId: string,
    valueId: string
  ) {
    setOptionGroups(
      (previous) =>
        previous.map(
          (group) =>
            group.id === groupId
              ? {
                  ...group,
                  values:
                    group.values.filter(
                      (value) =>
                        value.id !==
                        valueId
                    ),
                }
              : group
        )
    );

    setVariants([]);
  }

  function updateOptionValue(
    groupId: string,
    valueId: string,
    value: string
  ) {
    setOptionGroups(
      (previous) =>
        previous.map(
          (group) =>
            group.id === groupId
              ? {
                  ...group,
                  values:
                    group.values.map(
                      (item) =>
                        item.id ===
                        valueId
                          ? {
                              ...item,
                              value,
                            }
                          : item
                    ),
                }
              : group
        )
    );
  }

  // =====================================================
  // GENERATE VARIANTS
  // =====================================================

  function generateVariants() {
    if (optionGroups.length === 0) {
      Swal.fire(
        "Add Options",
        "Please add at least one option group.",
        "warning"
      );

      return;
    }

    const invalidGroup =
      optionGroups.find(
        (group) =>
          !group.name.trim() ||
          !group.values.some(
            (value) =>
              value.value.trim()
          )
      );

    if (invalidGroup) {
      Swal.fire(
        "Incomplete Options",
        "Every option group needs a name and at least one value.",
        "warning"
      );

      return;
    }

    const combinations =
      generateCombinations(
        optionGroups
      );

    if (combinations.length === 0) {
      Swal.fire(
        "No Variants",
        "Please add valid option values.",
        "warning"
      );

      return;
    }

    const existingByKey =
      new Map<string, VariantInput>();

    variants.forEach((variant) => {
      const key =
        variant.optionValueIds
          .slice()
          .sort()
          .join("-");

      existingByKey.set(
        key,
        variant
      );
    });

    const generated =
      combinations.map(
        (combination) => {
          /*
           * Keep the temporary frontend IDs
           * as strings.
           *
           * Do NOT convert these IDs to Number().
           */
          const optionValueIds =
            combination.map(
              (value) =>
                value.id
            );

          const optionLabels =
            combination.map(
              (value) =>
                value.value
            );

          const key =
            optionValueIds
              .slice()
              .sort()
              .join("-");

          const existing =
            existingByKey.get(key);

          if (existing) {
            return {
              ...existing,
              optionValueIds,
              optionLabels,
            };
          }

          return {
            id: createTemporaryId(),
            optionValueIds,
            optionLabels,
            sku: "",
            price,
            originalPrice,
            stock,
            images: [],
          };
        }
      );

    setVariants(generated);
  }

  // =====================================================
  // UPDATE VARIANT
  // =====================================================

  function updateVariant(
    variantId: string,
    field:
      | "sku"
      | "price"
      | "originalPrice"
      | "stock",
    value: string
  ) {
    setVariants(
      (previous) =>
        previous.map(
          (variant) =>
            variant.id === variantId
              ? {
                  ...variant,
                  [field]: value,
                }
              : variant
        )
    );
  }

  // =====================================================
  // VARIANT IMAGE PREVIEW
  // =====================================================

  function addVariantImages(
    variantId: string,
    files: File[]
  ) {
    if (files.length === 0) {
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

    const validFiles: File[] = [];

    for (const file of files) {
      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        Swal.fire(
          "Invalid Image",
          `${file.name} is not a supported image.`,
          "warning"
        );

        continue;
      }

      if (file.size > maxFileSize) {
        Swal.fire(
          "Image Too Large",
          `${file.name} is larger than 5 MB.`,
          "warning"
        );

        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    setVariants(
      (previous) =>
        previous.map(
          (variant) => {
            if (
              variant.id !==
              variantId
            ) {
              return variant;
            }

            const newImages =
              validFiles.map(
                (file, index) => ({
                  id: createTemporaryId(),
                  file,
                  previewUrl:
                    URL.createObjectURL(
                      file
                    ),
                  isPrimary:
                    variant.images.length ===
                      0 &&
                    index === 0,
                  viewType: "",
                })
              );

            return {
              ...variant,
              images: [
                ...variant.images,
                ...newImages,
              ],
            };
          }
        )
    );
  }

  function handleVariantImageChange(
    event: ChangeEvent<HTMLInputElement>,
    variantId: string
  ) {
    const files = Array.from(
      event.target.files || []
    );

    addVariantImages(
      variantId,
      files
    );

    event.target.value = "";
  }

  // =====================================================
  // REMOVE VARIANT IMAGE
  // =====================================================

  function removeVariantImage(
    variantId: string,
    imageId: string
  ) {
    setVariants(
      (previous) =>
        previous.map(
          (variant) => {
            if (
              variant.id !==
              variantId
            ) {
              return variant;
            }

            const removed =
              variant.images.find(
                (image) =>
                  image.id ===
                  imageId
              );

            const images =
              variant.images.filter(
                (image) =>
                  image.id !== imageId
              );

            if (
              removed?.isPrimary &&
              images.length > 0
            ) {
              images[0] = {
                ...images[0],
                isPrimary: true,
              };
            }

            return {
              ...variant,
              images,
            };
          }
        )
    );
  }

  // =====================================================
  // SET VARIANT PRIMARY IMAGE
  // =====================================================

  function setVariantPrimaryImage(
    variantId: string,
    imageId: string
  ) {
    setVariants(
      (previous) =>
        previous.map(
          (variant) =>
            variant.id === variantId
              ? {
                  ...variant,
                  images:
                    variant.images.map(
                      (image) => ({
                        ...image,
                        isPrimary:
                          image.id ===
                          imageId,
                      })
                    ),
                }
              : variant
        )
    );
  }

  // =====================================================
  // IMAGE VIEW TYPE
  // =====================================================

  function updateVariantImageViewType(
    variantId: string,
    imageId: string,
    value: string
  ) {
    setVariants(
      (previous) =>
        previous.map(
          (variant) =>
            variant.id === variantId
              ? {
                  ...variant,
                  images:
                    variant.images.map(
                      (image) =>
                        image.id === imageId
                          ? {
                              ...image,
                              viewType:
                                value,
                            }
                          : image
                    ),
                }
              : variant
        )
    );
  }

  // =====================================================
  // RESET VARIANT MODE
  // =====================================================

  function handleVariantModeChange(
    value: boolean
  ) {
    setHasVariants(value);

    if (!value) {
      setOptionGroups([]);
      setVariants([]);
    }
  }

  // =====================================================
  // VALIDATE BASIC PRODUCT
  // =====================================================

  async function validateBasicProduct(): Promise<boolean> {
    if (!name.trim()) {
      await Swal.fire(
        "Product Name Required",
        "Please enter a product name.",
        "warning"
      );

      return false;
    }

    if (
      price === "" ||
      Number(price) < 0
    ) {
      await Swal.fire(
        "Invalid Price",
        "Please enter a valid price.",
        "warning"
      );

      return false;
    }

    if (
      originalPrice !== "" &&
      Number(originalPrice) < 0
    ) {
      await Swal.fire(
        "Invalid Original Price",
        "Please enter a valid original price.",
        "warning"
      );

      return false;
    }

    if (
      stock === "" ||
      Number(stock) < 0
    ) {
      await Swal.fire(
        "Invalid Stock",
        "Please enter a valid stock.",
        "warning"
      );

      return false;
    }

    if (!categoryId) {
      await Swal.fire(
        "Category Required",
        "Please select a category.",
        "warning"
      );

      return false;
    }

    return true;
  }

  // =====================================================
  // VALIDATE VARIANTS
  // =====================================================

  async function validateVariants(): Promise<boolean> {
    if (!hasVariants) {
      return true;
    }

    if (optionGroups.length === 0) {
      await Swal.fire(
        "Options Required",
        "Please add at least one product option.",
        "warning"
      );

      return false;
    }

    if (variants.length === 0) {
      await Swal.fire(
        "Variants Required",
        "Please generate the product variants.",
        "warning"
      );

      return false;
    }

    for (const variant of variants) {
      if (
        variant.price === "" ||
        Number(variant.price) < 0
      ) {
        await Swal.fire(
          "Invalid Variant Price",
          `Please enter a valid price for ${variant.optionLabels.join(
            " / "
          )}.`,
          "warning"
        );

        return false;
      }

      if (
        variant.stock === "" ||
        Number(variant.stock) < 0
      ) {
        await Swal.fire(
          "Invalid Variant Stock",
          `Please enter valid stock for ${variant.optionLabels.join(
            " / "
          )}.`,
          "warning"
        );

        return false;
      }

      if (
        variant.originalPrice !== "" &&
        Number(
          variant.originalPrice
        ) < 0
      ) {
        await Swal.fire(
          "Invalid Original Price",
          `Please enter a valid original price for ${variant.optionLabels.join(
            " / "
          )}.`,
          "warning"
        );

        return false;
      }

      if (
        variant.images.length === 0
      ) {
        await Swal.fire(
          "Variant Images Required",
          `Please add at least one image for ${variant.optionLabels.join(
            " / "
          )}.`,
          "warning"
        );

        return false;
      }
    }

    return true;
  }

  // =====================================================
  // CREATE PRODUCT
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    /*
     * Backend requires at least one
     * product-level image for every product,
     * including products with variants.
     */
    if (imageFiles.length === 0) {
      await Swal.fire(
        "Product Image Required",
        "Please select at least one product image.",
        "warning"
      );

      openFilePicker();

      return;
    }

    const validBasicProduct =
      await validateBasicProduct();

    if (!validBasicProduct) {
      return;
    }

    const validVariants =
      await validateVariants();

    if (!validVariants) {
      return;
    }

    try {
      setSubmitting(true);

      // =================================================
      // CREATE BASE PRODUCT
      // =================================================

      const formData =
        new FormData();

      formData.append(
        "name",
        name.trim()
      );

      if (description.trim()) {
        formData.append(
          "description",
          description.trim()
        );
      }

      formData.append(
        "price",
        String(Number(price))
      );

      if (originalPrice !== "") {
        formData.append(
          "original_price",
          String(
            Number(originalPrice)
          )
        );
      }

      formData.append(
        "stock",
        String(Number(stock))
      );

      formData.append(
        "category_id",
        categoryId
      );

      /*
       * Product-level images are required
       * for both normal and variant products.
       */
      imageFiles.forEach(
        (file) => {
          formData.append(
            "file",
            file
          );
        }
      );

      formData.append(
        "primary_image_index",
        String(
          primaryImageIndex
        )
      );

      const product =
        await createProduct(
          formData
        );

      if (!product?.id) {
        throw new Error(
          "Product was created but no product ID was returned."
        );
      }

      // =================================================
      // NO VARIANT PRODUCT
      // =================================================

      if (!hasVariants) {
        await Swal.fire({
          icon: "success",
          title: "Product Created",
          text:
            "Product created successfully.",
          confirmButtonText: "OK",
        });

        router.push(
          "/seller/dashboard/products"
        );

        return;
      }

      // =================================================
      // CREATE OPTION GROUPS
      // AND MAP TEMP IDs → DATABASE IDs
      // =================================================

      const optionValueIdMap =
        new Map<string, number>();

      for (
        let groupIndex = 0;
        groupIndex <
        optionGroups.length;
        groupIndex++
      ) {
        const group =
          optionGroups[groupIndex];

        const validValues =
          group.values.filter(
            (value) =>
              value.value.trim()
          );

        const createdGroup =
          await createProductOption(
            product.id,
            {
              name:
                group.name.trim(),

              sort_order:
                groupIndex,

              values:
                validValues.map(
                  (
                    value,
                    valueIndex
                  ) => ({
                    value:
                      value.value.trim(),

                    sort_order:
                      valueIndex,
                  })
                ),
            }
          );

        const createdValues =
          (
            createdGroup as {
              values?: Array<{
                id: number;
                value: string;
              }>;
            }
          ).values || [];

        if (
          createdValues.length !==
          validValues.length
        ) {
          throw new Error(
            `Unable to map option values for "${group.name}".`
          );
        }

        validValues.forEach(
          (frontendValue, index) => {
            const databaseValue =
              createdValues[index];

            if (
              !databaseValue?.id
            ) {
              throw new Error(
                `Database option value was not returned for "${frontendValue.value}".`
              );
            }

            optionValueIdMap.set(
              frontendValue.id,
              databaseValue.id
            );
          }
        );
      }

      // =================================================
      // CREATE VARIANTS
      // =================================================

      for (
        const variant of variants
      ) {
        /*
         * Convert temporary frontend IDs
         * directly into real database IDs.
         */
        const databaseOptionValueIds =
          variant.optionValueIds.map(
            (temporaryId) => {
              const databaseId =
                optionValueIdMap.get(
                  temporaryId
                );

              if (
                !databaseId
              ) {
                throw new Error(
                  `Unable to find database option value ID for "${variant.optionLabels.join(
                    " / "
                  )}".`
                );
              }

              return databaseId;
            }
          );

        const createdVariant =
          await createProductVariant(
            product.id,
            {
              sku:
                variant.sku.trim() ||
                null,

              price:
                Number(
                  variant.price
                ),

              original_price:
                variant.originalPrice ===
                ""
                  ? null
                  : Number(
                      variant.originalPrice
                    ),

              stock:
                Number(
                  variant.stock
                ),

              option_value_ids:
                databaseOptionValueIds,
            }
          );

        // =================================================
        // UPLOAD VARIANT IMAGES
        // =================================================

        const uploadedImages: Array<{
          localId: string;
          backendId: number;
        }> = [];

        for (
          let imageIndex = 0;
          imageIndex <
          variant.images.length;
          imageIndex++
        ) {
          const image =
            variant.images[
              imageIndex
            ];

          const uploadedImage =
            await uploadProductVariantImage(
              createdVariant.id,
              image.file,
              {
                viewType:
                  image.viewType.trim() ||
                  undefined,

                sortOrder:
                  imageIndex,

                isPrimary:
                  imageIndex === 0,
              }
            );

          if (
            uploadedImage?.id
          ) {
            uploadedImages.push({
              localId:
                image.id,

              backendId:
                uploadedImage.id,
            });
          }
        }

        // =================================================
        // SET CORRECT PRIMARY VARIANT IMAGE
        // =================================================

        const primaryImage =
          variant.images.find(
            (image) =>
              image.isPrimary
          );

        if (primaryImage) {
          const backendPrimaryImage =
            uploadedImages.find(
              (image) =>
                image.localId ===
                primaryImage.id
            );

          if (
            backendPrimaryImage
          ) {
            await setProductVariantPrimaryImage(
              createdVariant.id,
              backendPrimaryImage.backendId
            );
          }
        }
      }

      // =================================================
      // SUCCESS
      // =================================================

      await Swal.fire({
        icon: "success",
        title: "Product Created",
        text:
          "Product and all variants were created successfully.",
        confirmButtonText: "OK",
      });

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
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">

        {/* BACK */}

        <Link
          href="/seller/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* HEADER */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Add New Product
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Add your product information,
            options, variants and images.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* PRODUCT INFORMATION */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Product Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">

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
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>

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
                  disabled={submitting}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Base Price *
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
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />

                {hasVariants && (
                  <p className="mt-1 text-xs text-gray-500">
                    Variant prices will be used for products with variants.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="originalPrice"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Base Original Price
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
                  placeholder="3999"
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="stock"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Base Stock *
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
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>

              {/* =================================================
                  HIERARCHICAL CATEGORY SELECTION
                  ================================================= */}

              <div>
                <label
                  htmlFor="category-level-0"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Category *
                </label>

                <div className="space-y-3">

                  {Array.from(
                    {
                      length:
                        selectedCategoryPath.length +
                        1,
                    },
                    (_, level) => {
                      const options =
                        getCategoryOptionsForLevel(
                          level
                        );

                      /*
                       * Do not show an empty
                       * dropdown when the current
                       * category has no children.
                       */
                      if (
                        level > 0 &&
                        options.length === 0
                      ) {
                        return null;
                      }

                      return (
                        <div
                          key={`category-level-${level}`}
                        >
                          {level > 0 && (
                            <label
                              htmlFor={`category-level-${level}`}
                              className="mb-2 block text-xs font-medium text-gray-500"
                            >
                              Subcategory
                            </label>
                          )}

                          <select
                            id={`category-level-${level}`}
                            value={
                              selectedCategoryPath[
                                level
                              ] || ""
                            }
                            onChange={(event) =>
                              handleCategoryChange(
                                level,
                                event.target.value
                              )
                            }
                            disabled={
                              submitting ||
                              loadingCategories ||
                              options.length === 0
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                          >
                            <option value="">
                              {level === 0
                                ? loadingCategories
                                  ? "Loading categories..."
                                  : "Select category"
                                : "Select subcategory"}
                            </option>

                            {options.map(
                              (category) => (
                                <option
                                  key={
                                    category.id
                                  }
                                  value={String(
                                    category.id
                                  )}
                                >
                                  {category.name}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      );
                    }
                  )}

                </div>

                {categoryId && (
                  <p className="mt-2 text-xs text-gray-500">
                    Selected category:{" "}
                    {getCategoryById(
                      categoryId
                    )?.name || categoryId}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* VARIANT MODE */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-gray-900">
              Product Variants
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Use variants when different options have their own price, stock or images.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <button
                type="button"
                onClick={() =>
                  handleVariantModeChange(
                    false
                  )
                }
                disabled={submitting}
                className={`rounded-xl border p-5 text-left transition ${
                  !hasVariants
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      !hasVariants
                        ? "border-black"
                        : "border-gray-400"
                    }`}
                  >
                    {!hasVariants && (
                      <div className="m-0.5 h-2.5 w-2.5 rounded-full bg-black" />
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">
                      No Variants
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      One price, stock and product gallery.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleVariantModeChange(
                    true
                  )
                }
                disabled={submitting}
                className={`rounded-xl border p-5 text-left transition ${
                  hasVariants
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      hasVariants
                        ? "border-black"
                        : "border-gray-400"
                    }`}
                  >
                    {hasVariants && (
                      <div className="m-0.5 h-2.5 w-2.5 rounded-full bg-black" />
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">
                      Has Variants
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Different options, prices, stock and galleries.
                    </p>
                  </div>
                </div>
              </button>

            </div>
          </div>

          {/* OPTIONS */}

          {hasVariants && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Product Options
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Examples: Color, Size, RAM, Storage, Capacity, Material.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    addOptionGroup
                  }
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </button>

              </div>

              {optionGroups.length === 0 && (
                <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-500">
                    No options added yet.
                  </p>

                  <button
                    type="button"
                    onClick={
                      addOptionGroup
                    }
                    className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
                  >
                    Add First Option
                  </button>
                </div>
              )}

              <div className="mt-5 space-y-5">

                {optionGroups.map(
                  (
                    group,
                    groupIndex
                  ) => (
                    <div
                      key={group.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                    >

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

                        <div className="flex-1">
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Option Name
                          </label>

                          <input
                            type="text"
                            value={
                              group.name
                            }
                            onChange={(
                              event
                            ) =>
                              updateOptionGroupName(
                                group.id,
                                event.target.value
                              )
                            }
                            placeholder="Color"
                            disabled={
                              submitting
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeOptionGroup(
                              group.id
                            )
                          }
                          disabled={
                            submitting
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>

                      </div>

                      <div className="mt-5">

                        <div className="mb-3 flex items-center justify-between">

                          <p className="text-sm font-medium text-gray-700">
                            Option Values
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              addOptionValue(
                                group.id
                              )
                            }
                            disabled={
                              submitting
                            }
                            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black"
                          >
                            <Plus className="h-4 w-4" />
                            Add Value
                          </button>

                        </div>

                        <div className="space-y-3">

                          {group.values.map(
                            (
                              value,
                              valueIndex
                            ) => (
                              <div
                                key={
                                  value.id
                                }
                                className="flex gap-2"
                              >

                                <input
                                  type="text"
                                  value={
                                    value.value
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateOptionValue(
                                      group.id,
                                      value.id,
                                      event.target.value
                                    )
                                  }
                                  placeholder={`Value ${
                                    valueIndex +
                                    1
                                  }`}
                                  disabled={
                                    submitting
                                  }
                                  className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeOptionValue(
                                      group.id,
                                      value.id
                                    )
                                  }
                                  disabled={
                                    submitting ||
                                    group
                                      .values
                                      .length <=
                                      1
                                  }
                                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <X className="h-4 w-4" />
                                </button>

                              </div>
                            )
                          )}

                        </div>
                      </div>

                      <p className="mt-4 text-xs text-gray-500">
                        Option {groupIndex + 1}
                      </p>

                    </div>
                  )
                )}

              </div>

              {optionGroups.length > 0 && (
                <button
                  type="button"
                  onClick={
                    generateVariants
                  }
                  disabled={submitting}
                  className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  Generate Variant Combinations
                </button>
              )}

            </div>
          )}

          {/* VARIANTS */}

          {hasVariants &&
            variants.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Variant Details
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Set price, stock, SKU and images for every combination.
                  </p>
                </div>

                <div className="mt-6 space-y-6">

                  {variants.map(
                    (variant) => (
                      <div
                        key={
                          variant.id
                        }
                        className="rounded-xl border border-gray-200 p-5"
                      >

                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {variant.optionLabels.join(
                                " / "
                              )}
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                              Variant
                            </p>
                          </div>

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {variant.images.length}{" "}
                            {variant.images.length ===
                            1
                              ? "image"
                              : "images"}
                          </span>

                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              SKU
                            </label>

                            <input
                              type="text"
                              value={
                                variant.sku
                              }
                              onChange={(
                                event
                              ) =>
                                updateVariant(
                                  variant.id,
                                  "sku",
                                  event.target.value
                                )
                              }
                              placeholder="SKU-001"
                              disabled={
                                submitting
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Price *
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                variant.price
                              }
                              onChange={(
                                event
                              ) =>
                                updateVariant(
                                  variant.id,
                                  "price",
                                  event.target.value
                                )
                              }
                              placeholder="799"
                              disabled={
                                submitting
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Original Price
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                variant.originalPrice
                              }
                              onChange={(
                                event
                              ) =>
                                updateVariant(
                                  variant.id,
                                  "originalPrice",
                                  event.target.value
                                )
                              }
                              placeholder="999"
                              disabled={
                                submitting
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Stock *
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={
                                variant.stock
                              }
                              onChange={(
                                event
                              ) =>
                                updateVariant(
                                  variant.id,
                                  "stock",
                                  event.target.value
                                )
                              }
                              placeholder="10"
                              disabled={
                                submitting
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                            />
                          </div>

                        </div>

                        {/* VARIANT IMAGES */}

                        <div className="mt-6 rounded-xl bg-gray-50 p-4">

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                              <h4 className="font-medium text-gray-900">
                                Variant Images
                              </h4>

                              <p className="mt-1 text-xs text-gray-500">
                                Upload every photo belonging to this variant.
                              </p>
                            </div>

                            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
                              <ImagePlus className="h-4 w-4" />
                              Add Images

                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                multiple
                                className="hidden"
                                disabled={
                                  submitting
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleVariantImageChange(
                                    event,
                                    variant.id
                                  )
                                }
                              />
                            </label>

                          </div>

                          {variant.images.length ===
                            0 && (
                            <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center">
                              <p className="text-sm text-gray-500">
                                No images added for this variant.
                              </p>
                            </div>
                          )}

                          {variant.images.length >
                            0 && (
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                              {variant.images.map(
                                (
                                  image
                                ) => (
                                  <div
                                    key={
                                      image.id
                                    }
                                    className={`overflow-hidden rounded-lg border bg-white ${
                                      image.isPrimary
                                        ? "border-black ring-2 ring-black"
                                        : "border-gray-200"
                                    }`}
                                  >

                                    <div className="relative h-40 bg-gray-100">

                                      <img
                                        src={
                                          image.previewUrl
                                        }
                                        alt={
                                          image.file
                                            .name
                                        }
                                        className="h-full w-full object-cover"
                                      />

                                      {image.isPrimary && (
                                        <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-xs font-semibold text-white">
                                          Main
                                        </span>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeVariantImage(
                                            variant.id,
                                            image.id
                                          )
                                        }
                                        disabled={
                                          submitting
                                        }
                                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow hover:bg-red-50 hover:text-red-600"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>

                                    </div>

                                    <div className="space-y-2 p-3">

                                      <select
                                        value={
                                          image.viewType
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          updateVariantImageViewType(
                                            variant.id,
                                            image.id,
                                            event.target.value
                                          )
                                        }
                                        disabled={
                                          submitting
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs outline-none focus:border-black"
                                      >
                                        <option value="">
                                          Image view
                                        </option>

                                        <option value="front">
                                          Front
                                        </option>

                                        <option value="back">
                                          Back
                                        </option>

                                        <option value="side">
                                          Side
                                        </option>

                                        <option value="detail">
                                          Detail
                                        </option>

                                        <option value="model">
                                          Model
                                        </option>

                                        <option value="top">
                                          Top
                                        </option>

                                        <option value="bottom">
                                          Bottom
                                        </option>

                                        <option value="other">
                                          Other
                                        </option>
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setVariantPrimaryImage(
                                            variant.id,
                                            image.id
                                          )
                                        }
                                        disabled={
                                          submitting ||
                                          image.isPrimary
                                        }
                                        className={`w-full rounded-lg px-3 py-2 text-xs font-semibold ${
                                          image.isPrimary
                                            ? "bg-black text-white"
                                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                        }`}
                                      >
                                        {image.isPrimary
                                          ? "Main Image"
                                          : "Set as Main"}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeVariantImage(
                                            variant.id,
                                            image.id
                                          )
                                        }
                                        disabled={
                                          submitting
                                        }
                                        className="flex w-full items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
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
                    )
                  )}

                </div>
              </div>
            )}

          {/* PRODUCT IMAGES */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-gray-900">
              Product Images
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select one or multiple photos. Maximum 10 photos, 5 MB each.
              These are the main product images.
            </p>

            {hasVariants && (
              <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                Products with variants still require at least one main product image.
                Variant-specific images are managed separately above.
              </p>
            )}

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

            <button
              type="button"
              onClick={
                openFilePicker
              }
              disabled={submitting}
              className="mt-5 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:border-gray-500 hover:bg-gray-100 disabled:opacity-60"
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

            {imageFiles.length >
              0 && (
              <>
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
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove all
                  </button>

                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  {imageFiles.map(
                    (
                      file,
                      index
                    ) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                        className={`overflow-hidden rounded-xl border ${
                          primaryImageIndex ===
                          index
                            ? "border-black ring-2 ring-black"
                            : "border-gray-200"
                        }`}
                      >

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

                          {primaryImageIndex ===
                            index && (
                            <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                              Main Image
                            </span>
                          )}

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
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>

                        </div>

                        <div className="space-y-2 p-3">

                          <p
                            className="truncate text-xs text-gray-500"
                            title={
                              file.name
                            }
                          >
                            {file.name}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setPrimaryImageIndex(
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
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>
              </>
            )}

          </div>

          {/* BUTTONS */}

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
              ) : hasVariants ? (
                `Create Product (${variants.length} ${
                  variants.length === 1
                    ? "Variant"
                    : "Variants"
                })`
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