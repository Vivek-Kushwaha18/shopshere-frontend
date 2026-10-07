"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import Swal from "sweetalert2";

import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
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

import {
  createProductOption,
  deleteProductOption,
  getProductOptions,
  type ProductOptionGroup,
} from "@/services/product-options";

import {
  createProductVariant,
  deleteProductVariant,
  getProductVariants,
  updateProductVariant,
  type ProductVariant,
} from "@/services/product-variants";

import {
  deleteProductVariantImage,
  getProductVariantImages,
  setProductVariantPrimaryImage,
  uploadProductVariantImage,
  type ProductVariantImage,
} from "@/services/product-variant-images";

interface NewOptionGroup {
  name: string;
  values: string;
}

interface VariantForm {
  price: string;
  originalPrice: string;
  stock: string;
  sku: string;
  optionValueIds: Record<number, number>;
}

export default function EditProductPage() {
  const params = useParams();

  const productSlug = String(params.id || "");

  const [product, setProduct] =
    useState<Product | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] =
    useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] =
    useState("");

  const [categories, setCategories] =
    useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [imageUpdatingId, setImageUpdatingId] =
    useState<number | null>(null);

  const [optionGroups, setOptionGroups] =
    useState<ProductOptionGroup[]>([]);
  const [loadingOptions, setLoadingOptions] =
    useState(false);

  const [newOptionGroups, setNewOptionGroups] =
    useState<NewOptionGroup[]>([]);
  const [creatingOption, setCreatingOption] =
    useState(false);

  const [variants, setVariants] =
    useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] =
    useState(false);

  const [variantForms, setVariantForms] =
    useState<Record<number, VariantForm>>({});

  const [savingVariantId, setSavingVariantId] =
    useState<number | null>(null);

  const [deletingVariantId, setDeletingVariantId] =
    useState<number | null>(null);

  const [variantImages, setVariantImages] =
    useState<Record<number, ProductVariantImage[]>>(
      {}
    );

  const [loadingVariantImages, setLoadingVariantImages] =
    useState<Record<number, boolean>>({});

  const [variantImageAction, setVariantImageAction] =
    useState<string | null>(null);

  const variantFileInputRefs =
    useRef<Record<number, HTMLInputElement | null>>(
      {}
    );

  const [newVariantForm, setNewVariantForm] =
    useState<VariantForm>({
      price: "",
      originalPrice: "",
      stock: "",
      sku: "",
      optionValueIds: {},
    });

  const [creatingVariant, setCreatingVariant] =
    useState(false);

  // =========================================================
  // LOAD VARIANT IMAGES
  // =========================================================

  const loadVariantImages = async (
    variantId: number
  ) => {
    try {
      setLoadingVariantImages((current) => ({
        ...current,
        [variantId]: true,
      }));

      const images =
        await getProductVariantImages(variantId);

      setVariantImages((current) => ({
        ...current,
        [variantId]: images,
      }));
    } catch (error) {
      console.error(
        "Load variant images error:",
        error
      );
    } finally {
      setLoadingVariantImages((current) => ({
        ...current,
        [variantId]: false,
      }));
    }
  };

  // =========================================================
  // LOAD OPTIONS + VARIANTS
  // =========================================================

  const loadOptionsAndVariants = async (
    productId: number
  ) => {
    try {
      setLoadingOptions(true);
      setLoadingVariants(true);

      const [
        optionsResult,
        variantsResult,
      ] = await Promise.all([
        getProductOptions(productId),
        getProductVariants(productId),
      ]);

      setOptionGroups(optionsResult);
      setVariants(variantsResult);

      const forms: Record<number, VariantForm> =
        {};

      variantsResult.forEach((variant) => {
        const optionMap: Record<number, number> =
          {};

        variant.option_values?.forEach(
          (optionValue) => {
            optionMap[
              optionValue.option_group_id
            ] = optionValue.id;
          }
        );

        forms[variant.id] = {
          price: String(variant.price),
          originalPrice:
            variant.original_price != null
              ? String(variant.original_price)
              : "",
          stock: String(variant.stock),
          sku: variant.sku || "",
          optionValueIds: optionMap,
        };
      });

      setVariantForms(forms);

      await Promise.all(
        variantsResult.map((variant) =>
          loadVariantImages(variant.id)
        )
      );
    } catch (error) {
      console.error(
        "Load options and variants error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load product variants."
      );
    } finally {
      setLoadingOptions(false);
      setLoadingVariants(false);
    }
  };

  // =========================================================
  // LOAD MAIN DATA
  // =========================================================

  useEffect(() => {
    async function loadData() {
      if (!productSlug) {
        setError("Invalid product slug.");
        setLoading(false);
        setLoadingCategories(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          productResult,
          categoryResult,
        ] = await Promise.all([
          getProduct(productSlug),
          getCategories(),
        ]);

        setProduct(productResult);

        setCategories(
          categoryResult.filter(
            (category) =>
              category.is_active !== false
          )
        );

        setName(productResult.name);
        setDescription(
          productResult.description || ""
        );
        setPrice(String(productResult.price));

        setOriginalPrice(
          productResult.original_price != null
            ? String(
                productResult.original_price
              )
            : ""
        );

        setStock(String(productResult.stock));

        setCategoryId(
          String(productResult.category_id)
        );

        await loadOptionsAndVariants(
          productResult.id
        );
      } catch (error) {
        console.error(
          "Seller edit product loading error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load product."
        );
      } finally {
        setLoading(false);
        setLoadingCategories(false);
      }
    }

    loadData();
  }, [productSlug]);

  // =========================================================
  // PRODUCT SUBMIT
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
      setError("Product name is required.");
      return;
    }

    if (!description.trim()) {
      setError("Product description is required.");
      return;
    }

    if (!price.trim()) {
      setError("Price is required.");
      return;
    }

    if (!originalPrice.trim()) {
      setError("Original price is required.");
      return;
    }

    if (!stock.trim()) {
      setError("Stock is required.");
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    const priceNumber = Number(price);
    const originalPriceNumber =
      Number(originalPrice);
    const stockNumber = Number(stock);
    const categoryIdNumber = Number(categoryId);

    if (!Number.isFinite(priceNumber)) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      !Number.isFinite(originalPriceNumber)
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
      setError("Price cannot be negative.");
      return;
    }

    if (originalPriceNumber < 0) {
      setError(
        "Original price cannot be negative."
      );
      return;
    }

    if (stockNumber < 0) {
      setError("Stock cannot be negative.");
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
        await updateProduct(product.id, {
          name: name.trim(),
          description: description.trim(),
          price: priceNumber,
          original_price: originalPriceNumber,
          stock: stockNumber,
          category_id: categoryIdNumber,
          image: product.image ?? null,
        });

      setProduct(updatedProduct);

      setSuccess(
        "Product information updated successfully."
      );
    } catch (error) {
      console.error(
        "Seller update product error:",
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
  // PRODUCT IMAGE - SET PRIMARY
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

      setProduct(updatedProduct);

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
  // PRODUCT IMAGE - DELETE
  // =========================================================

  const handleDeleteExistingImage = async (
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

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Image?",
      text: "This image will be permanently removed from the product.",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
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
        await getProduct(product.slug);

      setProduct(updatedProduct);

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
  // OPTION ROW
  // =========================================================

  const addOptionRow = () => {
    setNewOptionGroups((current) => [
      ...current,
      {
        name: "",
        values: "",
      },
    ]);
  };

  const removeOptionRow = (
    index: number
  ) => {
    setNewOptionGroups((current) =>
      current.filter(
        (_, currentIndex) =>
          currentIndex !== index
      )
    );
  };

  const updateOptionRow = (
    index: number,
    field: keyof NewOptionGroup,
    value: string
  ) => {
    setNewOptionGroups((current) =>
      current.map(
        (item, currentIndex) =>
          currentIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      )
    );
  };

  // =========================================================
  // CREATE OPTIONS
  // =========================================================

  const handleCreateOptions = async () => {
    if (
      creatingOption ||
      !product
    ) {
      return;
    }

    if (newOptionGroups.length === 0) {
      await Swal.fire(
        "No Options",
        "Please add an option group first.",
        "warning"
      );

      return;
    }

    const preparedOptions: {
      name: string;
      values: string[];
    }[] = [];

    const existingNames =
      new Set(
        optionGroups.map((group) =>
          group.name.trim().toLowerCase()
        )
      );

    for (const option of newOptionGroups) {
      const optionName =
        option.name.trim();

      if (!optionName) {
        await Swal.fire(
          "Option Name Required",
          "Every option group needs a name.",
          "warning"
        );

        return;
      }

      const values = option.values
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      if (values.length === 0) {
        await Swal.fire(
          "Option Values Required",
          `Please add values for ${optionName}.`,
          "warning"
        );

        return;
      }

      const uniqueValues = [
        ...new Set(
          values.map((value) =>
            value.toLowerCase()
          )
        ),
      ];

      if (
        uniqueValues.length !==
        values.length
      ) {
        await Swal.fire(
          "Duplicate Values",
          `Duplicate values found in ${optionName}.`,
          "warning"
        );

        return;
      }

      if (
        existingNames.has(
          optionName.toLowerCase()
        )
      ) {
        await Swal.fire(
          "Option Already Exists",
          `${optionName} already exists for this product.`,
          "warning"
        );

        return;
      }

      existingNames.add(
        optionName.toLowerCase()
      );

      preparedOptions.push({
        name: optionName,
        values,
      });
    }

    try {
      setCreatingOption(true);
      setError("");
      setSuccess("");

      for (
        const option of preparedOptions
      ) {
        await createProductOption(
          product.id,
          {
            name: option.name,
            values: option.values.map(
              (value, index) => ({
                value,
                sort_order: index,
              })
            ),
          }
        );
      }

      await loadOptionsAndVariants(
        product.id
      );

      setNewOptionGroups([]);

      setNewVariantForm({
        price,
        originalPrice,
        stock,
        sku: "",
        optionValueIds: {},
      });

      setSuccess(
        "Product options created successfully."
      );
    } catch (error) {
      console.error(
        "Create product options error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create product options."
      );
    } finally {
      setCreatingOption(false);
    }
  };

  // =========================================================
  // DELETE OPTION GROUP
  // =========================================================

  const handleDeleteOptionGroup =
    async (
      optionGroupId: number
    ) => {
      if (
        creatingOption ||
        !product ||
        savingVariantId !== null ||
        creatingVariant
      ) {
        return;
      }

      const optionGroup =
        optionGroups.find(
          (group) =>
            group.id === optionGroupId
        );

      const result = await Swal.fire({
        icon: "warning",
        title: "Delete Option?",
        text: `Delete ${
          optionGroup?.name ||
          "this option"
        }? Existing variants using this option may prevent deletion.`,
        showCancelButton: true,
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) {
        return;
      }

      try {
        setCreatingOption(true);
        setError("");
        setSuccess("");

        await deleteProductOption(
          optionGroupId
        );

        await loadOptionsAndVariants(
          product.id
        );

        setSuccess(
          "Option deleted successfully."
        );
      } catch (error) {
        console.error(
          "Delete option group error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to delete option."
        );
      } finally {
        setCreatingOption(false);
      }
    };

  // =========================================================
  // VARIANT FORM
  // =========================================================

  const updateVariantForm = (
    variantId: number,
    field: keyof Omit<
      VariantForm,
      "optionValueIds"
    >,
    value: string
  ) => {
    setVariantForms((current) => ({
      ...current,
      [variantId]: {
        ...current[variantId],
        [field]: value,
      },
    }));
  };

  const updateVariantOption = (
    variantId: number,
    groupId: number,
    valueId: number
  ) => {
    setVariantForms((current) => {
      const currentForm =
        current[variantId];

      if (!currentForm) {
        return current;
      }

      const nextOptions = {
        ...currentForm.optionValueIds,
      };

      if (valueId > 0) {
        nextOptions[groupId] =
          valueId;
      } else {
        delete nextOptions[groupId];
      }

      return {
        ...current,
        [variantId]: {
          ...currentForm,
          optionValueIds:
            nextOptions,
        },
      };
    });
  };

  // =========================================================
  // GET COMPLETE OPTION IDS
  // =========================================================

  const getCompleteOptionValueIds = (
    form: VariantForm
  ): number[] | null => {
    const ids: number[] = [];

    for (const group of optionGroups) {
      const valueId =
        form.optionValueIds[group.id];

      if (!valueId) {
        return null;
      }

      const valueExists =
        group.values.some(
          (value) =>
            value.id === valueId
        );

      if (!valueExists) {
        return null;
      }

      ids.push(valueId);
    }

    return ids;
  };

  // =========================================================
  // COMBINATION KEY
  // =========================================================

  const getCombinationKey = (
    ids: number[]
  ) => {
    return [...ids]
      .sort((a, b) => a - b)
      .join("-");
  };

  // =========================================================
  // CHECK DUPLICATE VARIANT
  // =========================================================

  const variantCombinationExists = (
    optionValueIds: number[],
    ignoredVariantId?: number
  ) => {
    const targetKey =
      getCombinationKey(
        optionValueIds
      );

    return variants.some(
      (variant) => {
        if (
          ignoredVariantId != null &&
          variant.id ===
            ignoredVariantId
        ) {
          return false;
        }

        const form =
          variantForms[
            variant.id
          ];

        if (!form) {
          return false;
        }

        const ids =
          getCompleteOptionValueIds(
            form
          );

        if (!ids) {
          return false;
        }

        return (
          getCombinationKey(ids) ===
          targetKey
        );
      }
    );
  };

  // =========================================================
  // SAVE VARIANT
  // =========================================================

  const handleSaveVariant =
    async (
      variant: ProductVariant
    ) => {
      if (
        savingVariantId !== null ||
        deletingVariantId !== null
      ) {
        return;
      }

      const form =
        variantForms[variant.id];

      if (!form) {
        return;
      }

      const variantPrice =
        Number(form.price);

      const variantOriginalPrice =
        form.originalPrice === ""
          ? null
          : Number(
              form.originalPrice
            );

      const variantStock =
        Number(form.stock);

      if (
        !Number.isFinite(
          variantPrice
        ) ||
        variantPrice < 0
      ) {
        setError(
          "Please enter a valid variant price."
        );
        return;
      }

      if (
        variantOriginalPrice !==
          null &&
        (!Number.isFinite(
          variantOriginalPrice
        ) ||
          variantOriginalPrice < 0)
      ) {
        setError(
          "Please enter a valid variant original price."
        );
        return;
      }

      if (
        !Number.isInteger(
          variantStock
        ) ||
        variantStock < 0
      ) {
        setError(
          "Variant stock must be a whole number."
        );
        return;
      }

      const optionValueIds =
        getCompleteOptionValueIds(
          form
        );

      if (!optionValueIds) {
        setError(
          "Please select one value for every option group."
        );
        return;
      }

      if (
        variantCombinationExists(
          optionValueIds,
          variant.id
        )
      ) {
        setError(
          "Another variant already uses this exact option combination."
        );
        return;
      }

      try {
        setSavingVariantId(
          variant.id
        );

        setError("");
        setSuccess("");

        const updatedVariant =
          await updateProductVariant(
            variant.id,
            {
              sku:
                form.sku.trim() ||
                null,
              price:
                variantPrice,
              original_price:
                variantOriginalPrice,
              stock:
                variantStock,
              option_value_ids:
                optionValueIds,
            }
          );

        setVariants((current) =>
          current.map(
            (item) =>
              item.id ===
              updatedVariant.id
                ? updatedVariant
                : item
          )
        );

        setSuccess(
          "Variant updated successfully."
        );

        await loadVariantImages(
          variant.id
        );
      } catch (error) {
        console.error(
          "Update variant error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to update variant."
        );
      } finally {
        setSavingVariantId(null);
      }
    };

  // =========================================================
  // DELETE VARIANT
  // =========================================================

  const handleDeleteVariant =
    async (
      variantId: number
    ) => {
      if (
        deletingVariantId !==
        null ||
        savingVariantId !== null ||
        creatingVariant
      ) {
        return;
      }

      const result = await Swal.fire({
        icon: "warning",
        title: "Delete Variant?",
        text: "This variant and its images will be permanently removed.",
        showCancelButton: true,
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) {
        return;
      }

      try {
        setDeletingVariantId(
          variantId
        );

        setError("");
        setSuccess("");

        await deleteProductVariant(
          variantId
        );

        setVariants((current) =>
          current.filter(
            (variant) =>
              variant.id !==
              variantId
          )
        );

        setVariantForms((current) => {
          const next = {
            ...current,
          };

          delete next[variantId];

          return next;
        });

        setVariantImages((current) => {
          const next = {
            ...current,
          };

          delete next[variantId];

          return next;
        });

        setSuccess(
          "Variant deleted successfully."
        );
      } catch (error) {
        console.error(
          "Delete variant error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to delete variant."
        );
      } finally {
        setDeletingVariantId(
          null
        );
      }
    };

  // =========================================================
  // NEW VARIANT OPTION
  // =========================================================

  const updateNewVariantOption = (
    groupId: number,
    valueId: number
  ) => {
    setNewVariantForm((current) => {
      const nextOptions = {
        ...current.optionValueIds,
      };

      if (valueId > 0) {
        nextOptions[groupId] =
          valueId;
      } else {
        delete nextOptions[groupId];
      }

      return {
        ...current,
        optionValueIds:
          nextOptions,
      };
    });
  };

  // =========================================================
  // CREATE VARIANT
  // =========================================================

  const handleCreateVariant =
    async () => {
      if (
        creatingVariant ||
        !product ||
        savingVariantId !== null ||
        deletingVariantId !== null
      ) {
        return;
      }

      if (optionGroups.length === 0) {
        await Swal.fire(
          "Options Required",
          "Create product options before creating variants.",
          "warning"
        );

        return;
      }

      const optionValueIds =
        getCompleteOptionValueIds(
          newVariantForm
        );

      if (!optionValueIds) {
        await Swal.fire(
          "Select Options",
          "Please select one value for every option group.",
          "warning"
        );

        return;
      }

      if (
        variantCombinationExists(
          optionValueIds
        )
      ) {
        await Swal.fire(
          "Variant Already Exists",
          "This exact option combination already exists.",
          "warning"
        );

        return;
      }

      const variantPrice =
        Number(
          newVariantForm.price
        );

      const variantOriginalPrice =
        newVariantForm.originalPrice ===
        ""
          ? null
          : Number(
              newVariantForm.originalPrice
            );

      const variantStock =
        Number(
          newVariantForm.stock
        );

      if (
        !Number.isFinite(
          variantPrice
        ) ||
        variantPrice < 0
      ) {
        await Swal.fire(
          "Invalid Price",
          "Please enter a valid variant price.",
          "warning"
        );

        return;
      }

      if (
        variantOriginalPrice !==
          null &&
        (!Number.isFinite(
          variantOriginalPrice
        ) ||
          variantOriginalPrice < 0)
      ) {
        await Swal.fire(
          "Invalid Original Price",
          "Please enter a valid variant original price.",
          "warning"
        );

        return;
      }

      if (
        !Number.isInteger(
          variantStock
        ) ||
        variantStock < 0
      ) {
        await Swal.fire(
          "Invalid Stock",
          "Variant stock must be a whole number.",
          "warning"
        );

        return;
      }

      try {
        setCreatingVariant(true);
        setError("");
        setSuccess("");

        const createdVariant =
          await createProductVariant(
            product.id,
            {
              sku:
                newVariantForm.sku.trim() ||
                null,
              price:
                variantPrice,
              original_price:
                variantOriginalPrice,
              stock:
                variantStock,
              option_value_ids:
                optionValueIds,
            }
          );

        setVariants((current) => [
          ...current,
          createdVariant,
        ]);

        const optionMap: Record<
          number,
          number
        > = {};

        optionGroups.forEach(
          (group) => {
            const selectedValue =
              newVariantForm
                .optionValueIds[
                group.id
              ];

            if (selectedValue) {
              optionMap[group.id] =
                selectedValue;
            }
          }
        );

        setVariantForms((current) => ({
          ...current,
          [createdVariant.id]: {
            price: String(
              createdVariant.price
            ),
            originalPrice:
              createdVariant.original_price !=
              null
                ? String(
                    createdVariant.original_price
                  )
                : "",
            stock: String(
              createdVariant.stock
            ),
            sku:
              createdVariant.sku ||
              "",
            optionValueIds:
              optionMap,
          },
        }));

        setVariantImages((current) => ({
          ...current,
          [createdVariant.id]: [],
        }));

        setNewVariantForm({
          price,
          originalPrice,
          stock,
          sku: "",
          optionValueIds: {},
        });

        setSuccess(
          "Variant created successfully."
        );
      } catch (error) {
        console.error(
          "Create variant error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to create variant."
        );
      } finally {
        setCreatingVariant(false);
      }
    };

  // =========================================================
  // OPEN VARIANT IMAGE PICKER
  // =========================================================

  const openVariantImagePicker = (
    variantId: number
  ) => {
    if (
      variantImageAction !==
      null
    ) {
      return;
    }

    variantFileInputRefs.current[
      variantId
    ]?.click();
  };

  // =========================================================
  // UPLOAD VARIANT IMAGE
  // =========================================================

  const handleVariantImageChange =
    async (
      event: ChangeEvent<HTMLInputElement>,
      variantId: number
    ) => {
      const files = Array.from(
        event.target.files || []
      );

      event.target.value = "";

      if (files.length === 0) {
        return;
      }

      const currentImages =
        variantImages[
          variantId
        ] || [];

      if (
        currentImages.length +
          files.length >
        10
      ) {
        await Swal.fire(
          "Maximum 10 Images",
          "A variant can have a maximum of 10 images.",
          "warning"
        );

        return;
      }

      try {
        for (
          let index = 0;
          index < files.length;
          index += 1
        ) {
          const file = files[index];

          const actionKey =
            `${variantId}-${file.name}-${index}`;

          setVariantImageAction(
            actionKey
          );

          await uploadProductVariantImage(
            variantId,
            file,
            {
              sortOrder:
                currentImages.length +
                index,
              isPrimary:
                currentImages.length ===
                  0 &&
                index === 0,
            }
          );
        }

        await loadVariantImages(
          variantId
        );

        setSuccess(
          "Variant images uploaded successfully."
        );
      } catch (error) {
        console.error(
          "Upload variant image error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to upload variant image."
        );
      } finally {
        setVariantImageAction(null);
      }
    };

  // =========================================================
  // SET VARIANT PRIMARY IMAGE
  // =========================================================

  const handleSetVariantPrimary =
    async (
      variantId: number,
      imageId: number
    ) => {
      if (
        variantImageAction !==
        null
      ) {
        return;
      }

      try {
        setVariantImageAction(
          `primary-${imageId}`
        );

        setError("");
        setSuccess("");

        await setProductVariantPrimaryImage(
          variantId,
          imageId
        );

        await loadVariantImages(
          variantId
        );

        setSuccess(
          "Variant main image updated successfully."
        );
      } catch (error) {
        console.error(
          "Set variant primary image error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to set variant main image."
        );
      } finally {
        setVariantImageAction(null);
      }
    };

  // =========================================================
  // DELETE VARIANT IMAGE
  // =========================================================

  const handleDeleteVariantImage =
    async (
      variantId: number,
      imageId: number
    ) => {
      if (
        variantImageAction !==
        null
      ) {
        return;
      }

      const currentImages =
        variantImages[
          variantId
        ] || [];

      if (
        currentImages.length <=
        1
      ) {
        await Swal.fire(
          "Cannot Delete",
          "A variant must have at least one image.",
          "warning"
        );

        return;
      }

      const result = await Swal.fire({
        icon: "warning",
        title: "Delete Image?",
        text: "This variant image will be permanently removed.",
        showCancelButton: true,
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) {
        return;
      }

      try {
        setVariantImageAction(
          `delete-${imageId}`
        );

        setError("");
        setSuccess("");

        await deleteProductVariantImage(
          variantId,
          imageId
        );

        await loadVariantImages(
          variantId
        );

        setSuccess(
          "Variant image deleted successfully."
        );
      } catch (error) {
        console.error(
          "Delete variant image error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to delete variant image."
        );
      } finally {
        setVariantImageAction(null);
      }
    };

  // =========================================================
  // VARIANT LABEL
  // =========================================================

  const getVariantLabel = (
    variant: ProductVariant
  ) => {
    const form =
      variantForms[variant.id];

    if (!form) {
      return `Variant #${variant.id}`;
    }

    const labels =
      optionGroups
        .map((group) => {
          const valueId =
            form.optionValueIds[
              group.id
            ];

          const value =
            group.values.find(
              (item) =>
                item.id === valueId
            );

          return value
            ? `${group.name}: ${value.value}`
            : null;
        })
        .filter(
          (
            value
          ): value is string =>
            Boolean(value)
        );

    return labels.length > 0
      ? labels.join(" • ")
      : `Variant #${variant.id}`;
  };

  const existingImages =
    product?.images ?? [];

  const hasOptions =
    optionGroups.length > 0;

  const hasVariants =
    variants.length > 0;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
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
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link
            href="/seller/dashboard/products"
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
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">

        {/* BACK */}

        <div className="mb-5">
          <Link
            href="/seller/dashboard/products"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>

        {/* HEADER */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Product
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update product information, options,
            variants, and images.
          </p>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* PRODUCT IMAGES */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
              {existingImages.map((image) => (
                <div
                  key={image.id}
                  className={`overflow-hidden rounded-xl border ${
                    image.is_primary
                      ? "border-black ring-2 ring-black"
                      : "border-gray-200"
                  }`}
                >
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
                      }`}
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
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT INFORMATION */}

        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Product Information
          </h2>

          <div className="space-y-6">

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
                  setName(event.target.value)
                }
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
              />
            </div>

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
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
              />
            </div>

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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>
            </div>

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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/seller/dashboard/products"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving ||
                loadingCategories
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

        {/* PRODUCT OPTIONS */}

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Product Options
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add options such as Color, Size, RAM,
                Storage, Capacity, or Material.
              </p>
            </div>

            <button
              type="button"
              onClick={addOptionRow}
              disabled={
                creatingOption ||
                creatingVariant ||
                savingVariantId !== null
              }
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Option
            </button>
          </div>

          {loadingOptions ? (
            <div className="mt-6 flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {optionGroups.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">
                    No product options have been added yet.
                  </p>
                </div>
              ) : (
                optionGroups.map(
                  (group) => (
                    <div
                      key={group.id}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {group.name}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {group.values.map(
                              (value) => (
                                <span
                                  key={
                                    value.id
                                  }
                                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                                >
                                  {
                                    value.value
                                  }
                                </span>
                              )
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteOptionGroup(
                              group.id
                            )
                          }
                          disabled={
                            creatingOption ||
                            creatingVariant ||
                            savingVariantId !==
                              null
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}

          {newOptionGroups.length > 0 && (
            <div className="mt-6 space-y-4">
              {newOptionGroups.map(
                (option, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-[1fr_2fr_auto]">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Option Name
                        </label>

                        <input
                          type="text"
                          value={
                            option.name
                          }
                          onChange={(event) =>
                            updateOptionRow(
                              index,
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="Color"
                          disabled={
                            creatingOption
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Values
                        </label>

                        <input
                          type="text"
                          value={
                            option.values
                          }
                          onChange={(event) =>
                            updateOptionRow(
                              index,
                              "values",
                              event.target.value
                            )
                          }
                          placeholder="Black, White, Blue"
                          disabled={
                            creatingOption
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />

                        <p className="mt-1 text-xs text-gray-500">
                          Separate values with commas.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeOptionRow(
                            index
                          )
                        }
                        disabled={
                          creatingOption
                        }
                        className="self-end rounded-lg bg-red-50 p-2.5 text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              )}

              <button
                type="button"
                onClick={
                  handleCreateOptions
                }
                disabled={
                  creatingOption
                }
                className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingOption ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Options...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Save Options
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* CREATE NEW VARIANT */}

        {hasOptions && (
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add Variant
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create a specific combination of product options.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {optionGroups.map(
                (group) => (
                  <div key={group.id}>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {group.name}
                    </label>

                    <select
                      value={
                        newVariantForm
                          .optionValueIds[
                          group.id
                        ] ?? ""
                      }
                      onChange={(event) =>
                        updateNewVariantOption(
                          group.id,
                          Number(
                            event.target.value
                          )
                        )
                      }
                      disabled={
                        creatingVariant
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    >
                      <option value="">
                        Select {group.name}
                      </option>

                      {group.values.map(
                        (value) => (
                          <option
                            key={
                              value.id
                            }
                            value={
                              value.id
                            }
                          >
                            {
                              value.value
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  SKU
                </label>

                <input
                  type="text"
                  value={
                    newVariantForm.sku
                  }
                  onChange={(event) =>
                    setNewVariantForm(
                      (current) => ({
                        ...current,
                        sku: event.target
                          .value,
                      })
                    )
                  }
                  placeholder="SHIRT-BLK-M"
                  disabled={
                    creatingVariant
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                    newVariantForm.price
                  }
                  onChange={(event) =>
                    setNewVariantForm(
                      (current) => ({
                        ...current,
                        price:
                          event.target
                            .value,
                      })
                    )
                  }
                  disabled={
                    creatingVariant
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                    newVariantForm.originalPrice
                  }
                  onChange={(event) =>
                    setNewVariantForm(
                      (current) => ({
                        ...current,
                        originalPrice:
                          event.target
                            .value,
                      })
                    )
                  }
                  disabled={
                    creatingVariant
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                    newVariantForm.stock
                  }
                  onChange={(event) =>
                    setNewVariantForm(
                      (current) => ({
                        ...current,
                        stock:
                          event.target
                            .value,
                      })
                    )
                  }
                  disabled={
                    creatingVariant
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleCreateVariant
              }
              disabled={
                creatingVariant ||
                savingVariantId !== null ||
                deletingVariantId !== null
              }
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingVariant ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Variant...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Variant
                </>
              )}
            </button>
          </section>
        )}

        {/* EXISTING VARIANTS */}

        {hasOptions && (
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Product Variants
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage price, stock, SKU, options, and variant images.
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                {variants.length}{" "}
                {variants.length === 1
                  ? "variant"
                  : "variants"}
              </span>
            </div>

            {loadingVariants ? (
              <div className="mt-8 flex items-center justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-gray-500" />
              </div>
            ) : variants.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-500">
                  No variants created yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-8">
                {variants.map(
                  (variant) => {
                    const form =
                      variantForms[
                        variant.id
                      ];

                    const images =
                      variantImages[
                        variant.id
                      ] || [];

                    return (
                      <div
                        key={
                          variant.id
                        }
                        className="rounded-xl border border-gray-200 p-5"
                      >

                        {/* VARIANT HEADER */}

                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {getVariantLabel(
                                variant
                              )}
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                              Variant ID:{" "}
                              {
                                variant.id
                              }
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteVariant(
                                variant.id
                              )
                            }
                            disabled={
                              deletingVariantId !==
                                null ||
                              savingVariantId !==
                                null ||
                              creatingVariant
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingVariantId ===
                            variant.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}

                            Delete Variant
                          </button>
                        </div>

                        {/* VARIANT FIELDS */}

                        {form && (
                          <div className="mt-5 grid gap-5 sm:grid-cols-2">

                            {optionGroups.map(
                              (group) => (
                                <div
                                  key={
                                    group.id
                                  }
                                >
                                  <label className="mb-2 block text-sm font-medium text-gray-700">
                                    {
                                      group.name
                                    }
                                  </label>

                                  <select
                                    value={
                                      form
                                        .optionValueIds[
                                        group.id
                                      ] ??
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateVariantOption(
                                        variant.id,
                                        group.id,
                                        Number(
                                          event.target.value
                                        )
                                      )
                                    }
                                    disabled={
                                      savingVariantId !==
                                        null ||
                                      deletingVariantId !==
                                        null
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                                  >
                                    <option value="">
                                      Select{" "}
                                      {
                                        group.name
                                      }
                                    </option>

                                    {group.values.map(
                                      (
                                        value
                                      ) => (
                                        <option
                                          key={
                                            value.id
                                          }
                                          value={
                                            value.id
                                          }
                                        >
                                          {
                                            value.value
                                          }
                                        </option>
                                      )
                                    )}
                                  </select>
                                </div>
                              )
                            )}

                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                SKU
                              </label>

                              <input
                                type="text"
                                value={
                                  form.sku
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariantForm(
                                    variant.id,
                                    "sku",
                                    event.target.value
                                  )
                                }
                                disabled={
                                  savingVariantId !==
                                    null ||
                                  deletingVariantId !==
                                    null
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                                  form.price
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariantForm(
                                    variant.id,
                                    "price",
                                    event.target.value
                                  )
                                }
                                disabled={
                                  savingVariantId !==
                                    null ||
                                  deletingVariantId !==
                                    null
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                                  form.originalPrice
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariantForm(
                                    variant.id,
                                    "originalPrice",
                                    event.target.value
                                  )
                                }
                                disabled={
                                  savingVariantId !==
                                    null ||
                                  deletingVariantId !==
                                    null
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                                  form.stock
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariantForm(
                                    variant.id,
                                    "stock",
                                    event.target.value
                                  )
                                }
                                disabled={
                                  savingVariantId !==
                                    null ||
                                  deletingVariantId !==
                                    null
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                              />
                            </div>
                          </div>
                        )}

                        {/* SAVE VARIANT */}

                        <button
                          type="button"
                          onClick={() =>
                            handleSaveVariant(
                              variant
                            )
                          }
                          disabled={
                            savingVariantId !==
                              null ||
                            deletingVariantId !==
                              null ||
                            creatingVariant
                          }
                          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingVariantId ===
                          variant.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving Variant...
                            </>
                          ) : (
                            "Save Variant"
                          )}
                        </button>

                        {/* VARIANT IMAGES */}

                        <div className="mt-7 border-t border-gray-200 pt-6">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Variant Images
                              </h4>

                              <p className="mt-1 text-xs text-gray-500">
                                Add multiple photos for this exact variant.
                              </p>
                            </div>

                            <span className="text-xs text-gray-500">
                              {images.length}/10
                            </span>
                          </div>

                          <input
                            ref={(element) => {
                              variantFileInputRefs.current[
                                variant.id
                              ] = element;
                            }}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            onChange={(event) =>
                              handleVariantImageChange(
                                event,
                                variant.id
                              )
                            }
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              openVariantImagePicker(
                                variant.id
                              )
                            }
                            disabled={
                              images.length >=
                                10 ||
                              variantImageAction !==
                                null ||
                              savingVariantId !==
                                null ||
                              deletingVariantId !==
                                null
                            }
                            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Variant Images
                          </button>

                          {loadingVariantImages[
                            variant.id
                          ] ? (
                            <div className="mt-5 flex items-center justify-center py-6">
                              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                            </div>
                          ) : images.length === 0 ? (
                            <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                              <p className="text-sm text-gray-500">
                                No images for this variant yet.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                              {images.map(
                                (image) => (
                                  <div
                                    key={
                                      image.id
                                    }
                                    className={`overflow-hidden rounded-xl border ${
                                      image.is_primary
                                        ? "border-black ring-2 ring-black"
                                        : "border-gray-200"
                                    }`}
                                  >
                                    <div className="relative aspect-square bg-gray-100">
                                      <img
                                        src={
                                          image.image_url
                                        }
                                        alt={`${getVariantLabel(
                                          variant
                                        )} variant image`}
                                        className="h-full w-full object-cover"
                                      />

                                      {image.is_primary && (
                                        <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[10px] font-semibold text-white">
                                          Main
                                        </span>
                                      )}
                                    </div>

                                    <div className="space-y-2 p-3">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSetVariantPrimary(
                                            variant.id,
                                            image.id
                                          )
                                        }
                                        disabled={
                                          variantImageAction !==
                                            null ||
                                          image.is_primary ||
                                          savingVariantId !==
                                            null ||
                                          deletingVariantId !==
                                            null
                                        }
                                        className={`w-full rounded-lg px-3 py-2 text-xs font-medium ${
                                          image.is_primary
                                            ? "bg-black text-white"
                                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                        }`}
                                      >
                                        {variantImageAction ===
                                        `primary-${image.id}` ? (
                                          "Updating..."
                                        ) : image.is_primary ? (
                                          "Main Image"
                                        ) : (
                                          "Set as Main"
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteVariantImage(
                                            variant.id,
                                            image.id
                                          )
                                        }
                                        disabled={
                                          variantImageAction !==
                                            null ||
                                          savingVariantId !==
                                            null ||
                                          deletingVariantId !==
                                            null
                                        }
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}

        {/* NO VARIANTS */}

        {!hasOptions && (
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                No Variants
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
                This product currently has no options or variants.
                You can leave it as a normal product or add options
                above, such as Color, Size, RAM, Storage, Capacity,
                or Material.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}