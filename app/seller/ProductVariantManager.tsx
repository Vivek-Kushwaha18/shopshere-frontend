"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Swal from "sweetalert2";

import {
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

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

interface ProductVariantManagerProps {
  productId: number;
  productPrice?: number;
  productOriginalPrice?: number | null;
  productStock?: number;
}

export default function ProductVariantManager({
  productId,
  productPrice = 0,
  productOriginalPrice = null,
  productStock = 0,
}: ProductVariantManagerProps) {
  // =========================================================
  // OPTIONS
  // =========================================================

  const [optionGroups, setOptionGroups] =
    useState<ProductOptionGroup[]>([]);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [newOptionGroups, setNewOptionGroups] =
    useState<NewOptionGroup[]>([]);

  const [creatingOption, setCreatingOption] =
    useState(false);

  // =========================================================
  // VARIANTS
  // =========================================================

  const [variants, setVariants] =
    useState<ProductVariant[]>([]);

  const [loadingVariants, setLoadingVariants] =
    useState(true);

  const [variantForms, setVariantForms] =
    useState<Record<number, VariantForm>>({});

  const [savingVariantId, setSavingVariantId] =
    useState<number | null>(null);

  const [deletingVariantId, setDeletingVariantId] =
    useState<number | null>(null);

  // =========================================================
  // VARIANT IMAGES
  // =========================================================

  const [variantImages, setVariantImages] =
    useState<
      Record<number, ProductVariantImage[]>
    >({});

  const [loadingVariantImages, setLoadingVariantImages] =
    useState<Record<number, boolean>>({});

  const [variantImageAction, setVariantImageAction] =
    useState<string | null>(null);

  const variantFileInputRefs =
    useRef<
      Record<number, HTMLInputElement | null>
    >({});

  // =========================================================
  // NEW VARIANT
  // =========================================================

  const [newVariantForm, setNewVariantForm] =
    useState<VariantForm>({
      price: String(productPrice),
      originalPrice:
        productOriginalPrice !== null
          ? String(productOriginalPrice)
          : "",
      stock: String(productStock),
      sku: "",
      optionValueIds: {},
    });

  const [creatingVariant, setCreatingVariant] =
    useState(false);

  // =========================================================
  // MESSAGES
  // =========================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // LOAD OPTIONS + VARIANTS
  // =========================================================

  const loadOptionsAndVariants =
    async () => {
      try {
        setLoadingOptions(true);
        setLoadingVariants(true);
        setError("");

        const [
          optionsResult,
          variantsResult,
        ] = await Promise.all([
          getProductOptions(productId),
          getProductVariants(productId),
        ]);

        setOptionGroups(
          optionsResult
        );

        setVariants(
          variantsResult
        );

        const forms: Record<
          number,
          VariantForm
        > = {};

        variantsResult.forEach(
          (variant) => {
            const optionMap: Record<
              number,
              number
            > = {};

            variant.option_values?.forEach(
              (optionValue) => {
                optionMap[
                  optionValue.option_group_id
                ] =
                  optionValue.id;
              }
            );

            forms[variant.id] = {
              price:
                String(
                  variant.price
                ),

              originalPrice:
                variant.original_price !==
                null
                  ? String(
                      variant.original_price
                    )
                  : "",

              stock:
                String(
                  variant.stock
                ),

              sku:
                variant.sku ||
                "",

              optionValueIds:
                optionMap,
            };
          }
        );

        setVariantForms(
          forms
        );

        for (
          const variant of variantsResult
        ) {
          await loadVariantImages(
            variant.id
          );
        }
      } catch (loadError) {
        console.error(
          "Load product variants error:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load product options and variants."
        );
      } finally {
        setLoadingOptions(false);
        setLoadingVariants(false);
      }
    };

  // =========================================================
  // LOAD VARIANT IMAGES
  // =========================================================

  const loadVariantImages =
    async (
      variantId: number
    ) => {
      try {
        setLoadingVariantImages(
          (current) => ({
            ...current,
            [variantId]: true,
          })
        );

        const images =
          await getProductVariantImages(
            variantId
          );

        setVariantImages(
          (current) => ({
            ...current,
            [variantId]: images,
          })
        );
      } catch (loadError) {
        console.error(
          "Load variant images error:",
          loadError
        );
      } finally {
        setLoadingVariantImages(
          (current) => ({
            ...current,
            [variantId]: false,
          })
        );
      }
    };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!productId) {
      setError(
        "Invalid product ID."
      );
      setLoadingOptions(false);
      setLoadingVariants(false);
      return;
    }

    loadOptionsAndVariants();
  }, [productId]);

  // =========================================================
  // UPDATE DEFAULT NEW VARIANT VALUES
  // =========================================================

  useEffect(() => {
    setNewVariantForm(
      (current) => ({
        ...current,

        price:
          current.price === ""
            ? String(productPrice)
            : current.price,

        originalPrice:
          current.originalPrice === "" &&
          productOriginalPrice !== null
            ? String(
                productOriginalPrice
              )
            : current.originalPrice,

        stock:
          current.stock === ""
            ? String(productStock)
            : current.stock,
      })
    );
  }, [
    productPrice,
    productOriginalPrice,
    productStock,
  ]);

  // =========================================================
  // ADD OPTION ROW
  // =========================================================

  const addOptionRow = () => {
    setNewOptionGroups(
      (current) => [
        ...current,
        {
          name: "",
          values: "",
        },
      ]
    );
  };

  // =========================================================
  // REMOVE OPTION ROW
  // =========================================================

  const removeOptionRow = (
    index: number
  ) => {
    setNewOptionGroups(
      (current) =>
        current.filter(
          (_, currentIndex) =>
            currentIndex !== index
        )
    );
  };

  // =========================================================
  // UPDATE OPTION ROW
  // =========================================================

  const updateOptionRow = (
    index: number,
    field: keyof NewOptionGroup,
    value: string
  ) => {
    setNewOptionGroups(
      (current) =>
        current.map(
          (
            item,
            currentIndex
          ) =>
            currentIndex ===
            index
              ? {
                  ...item,
                  [field]:
                    value,
                }
              : item
        )
    );
  };

  // =========================================================
  // CREATE OPTIONS
  // =========================================================

  const handleCreateOptions =
    async () => {
      if (
        creatingOption
      ) {
        return;
      }

      if (
        newOptionGroups.length ===
        0
      ) {
        await Swal.fire(
          "No Options",
          "Please add an option group first.",
          "warning"
        );

        return;
      }

      for (
        const option of newOptionGroups
      ) {
        if (
          !option.name.trim()
        ) {
          await Swal.fire(
            "Option Name Required",
            "Every option group needs a name.",
            "warning"
          );

          return;
        }

        const values =
          option.values
            .split(",")
            .map(
              (value) =>
                value.trim()
            )
            .filter(Boolean);

        if (
          values.length ===
          0
        ) {
          await Swal.fire(
            "Option Values Required",
            `Please add values for ${option.name}.`,
            "warning"
          );

          return;
        }
      }

      try {
        setCreatingOption(
          true
        );

        setError("");
        setSuccess("");

        for (
          const option of newOptionGroups
        ) {
          const values =
            option.values
              .split(",")
              .map(
                (value) =>
                  value.trim()
              )
              .filter(Boolean);

          await createProductOption(
            productId,
            {
              name:
                option.name.trim(),

              values:
                values.map(
                  (
                    value,
                    index
                  ) => ({
                    value,
                    sort_order:
                      index,
                  })
                ),
            }
          );
        }

        const updatedOptions =
          await getProductOptions(
            productId
          );

        setOptionGroups(
          updatedOptions
        );

        setNewOptionGroups(
          []
        );

        setNewVariantForm(
          (current) => ({
            ...current,

            price:
              current.price ||
              String(
                productPrice
              ),

            originalPrice:
              current.originalPrice ||
              (productOriginalPrice !==
              null
                ? String(
                    productOriginalPrice
                  )
                : ""),

            stock:
              current.stock ||
              String(
                productStock
              ),

            sku: "",

            optionValueIds:
              {},
          })
        );

        setSuccess(
          "Product options created successfully."
        );
      } catch (createError) {
        console.error(
          "Create product options error:",
          createError
        );

        setError(
          createError instanceof Error
            ? createError.message
            : "Unable to create product options."
        );
      } finally {
        setCreatingOption(
          false
        );
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
        creatingOption
      ) {
        return;
      }

      const optionGroup =
        optionGroups.find(
          (group) =>
            group.id ===
            optionGroupId
        );

      const result =
        await Swal.fire({
          icon: "warning",

          title:
            "Delete Option?",

          text: `Delete ${
            optionGroup?.name ||
            "this option"
          }? Existing variants using this option may prevent deletion.`,

          showCancelButton:
            true,

          confirmButtonText:
            "Yes, Delete",

          cancelButtonText:
            "Cancel",
        });

      if (
        !result.isConfirmed
      ) {
        return;
      }

      try {
        setCreatingOption(
          true
        );

        setError("");
        setSuccess("");

        await deleteProductOption(
          optionGroupId
        );

        const updatedOptions =
          await getProductOptions(
            productId
          );

        setOptionGroups(
          updatedOptions
        );

        setSuccess(
          "Option deleted successfully."
        );
      } catch (deleteError) {
        console.error(
          "Delete option group error:",
          deleteError
        );

        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to delete option."
        );
      } finally {
        setCreatingOption(
          false
        );
      }
    };

  // =========================================================
  // UPDATE VARIANT FORM
  // =========================================================

  const updateVariantForm = (
    variantId: number,
    field: keyof Omit<
      VariantForm,
      "optionValueIds"
    >,
    value: string
  ) => {
    setVariantForms(
      (current) => ({
        ...current,

        [variantId]: {
          ...current[
            variantId
          ],

          [field]:
            value,
        },
      })
    );
  };

  // =========================================================
  // UPDATE VARIANT OPTION
  // =========================================================

  const updateVariantOption =
    (
      variantId: number,
      groupId: number,
      valueId: number
    ) => {
      setVariantForms(
        (current) => ({
          ...current,

          [variantId]: {
            ...current[
              variantId
            ],

            optionValueIds: {
              ...current[
                variantId
              ]
                ?.optionValueIds,

              [groupId]:
                valueId,
            },
          },
        })
      );
    };

  // =========================================================
  // SAVE VARIANT
  // =========================================================

  const handleSaveVariant =
    async (
      variant: ProductVariant
    ) => {
      const form =
        variantForms[
          variant.id
        ];

      if (!form) {
        return;
      }

      const variantPrice =
        Number(
          form.price
        );

      const variantOriginalPrice =
        form.originalPrice ===
        ""
          ? null
          : Number(
              form.originalPrice
            );

      const variantStock =
        Number(
          form.stock
        );

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
          variantOriginalPrice <
            0)
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
        optionGroups.map(
          (group) =>
            form
              .optionValueIds[
              group.id
            ]
        );

      if (
        optionValueIds.some(
          (
            valueId
          ) =>
            !Number.isInteger(
              valueId
            ) ||
            valueId <= 0
        )
      ) {
        setError(
          "Please select one value for every option group."
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

        setVariants(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                updatedVariant.id
                  ? updatedVariant
                  : item
            )
        );

        const optionMap: Record<
          number,
          number
        > = {};

        updatedVariant.option_values?.forEach(
          (optionValue) => {
            optionMap[
              optionValue.option_group_id
            ] =
              optionValue.id;
          }
        );

        setVariantForms(
          (current) => ({
            ...current,

            [updatedVariant.id]:
              {
                price:
                  String(
                    updatedVariant.price
                  ),

                originalPrice:
                  updatedVariant.original_price !==
                  null
                    ? String(
                        updatedVariant.original_price
                      )
                    : "",

                stock:
                  String(
                    updatedVariant.stock
                  ),

                sku:
                  updatedVariant.sku ||
                  "",

                optionValueIds:
                  optionMap,
              },
          })
        );

        setSuccess(
          "Variant updated successfully."
        );

        await loadVariantImages(
          variant.id
        );
      } catch (updateError) {
        console.error(
          "Update variant error:",
          updateError
        );

        setError(
          updateError instanceof Error
            ? updateError.message
            : "Unable to update variant."
        );
      } finally {
        setSavingVariantId(
          null
        );
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
        null
      ) {
        return;
      }

      const result =
        await Swal.fire({
          icon: "warning",

          title:
            "Delete Variant?",

          text: "This variant and its images will be permanently removed.",

          showCancelButton:
            true,

          confirmButtonText:
            "Yes, Delete",

          cancelButtonText:
            "Cancel",
        });

      if (
        !result.isConfirmed
      ) {
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

        setVariants(
          (current) =>
            current.filter(
              (variant) =>
                variant.id !==
                variantId
            )
        );

        setVariantForms(
          (current) => {
            const next = {
              ...current,
            };

            delete next[
              variantId
            ];

            return next;
          }
        );

        setVariantImages(
          (current) => {
            const next = {
              ...current,
            };

            delete next[
              variantId
            ];

            return next;
          }
        );

        setSuccess(
          "Variant deleted successfully."
        );
      } catch (deleteError) {
        console.error(
          "Delete variant error:",
          deleteError
        );

        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to delete variant."
        );
      } finally {
        setDeletingVariantId(
          null
        );
      }
    };

  // =========================================================
  // UPDATE NEW VARIANT OPTION
  // =========================================================

  const updateNewVariantOption =
    (
      groupId: number,
      valueId: number
    ) => {
      setNewVariantForm(
        (current) => ({
          ...current,

          optionValueIds: {
            ...current.optionValueIds,

            [groupId]:
              valueId,
          },
        })
      );
    };

  // =========================================================
  // CREATE VARIANT
  // =========================================================

  const handleCreateVariant =
    async () => {
      if (
        creatingVariant
      ) {
        return;
      }

      if (
        optionGroups.length ===
        0
      ) {
        await Swal.fire(
          "Options Required",
          "Create product options before creating variants.",
          "warning"
        );

        return;
      }

      const optionValueIds =
        optionGroups.map(
          (group) =>
            newVariantForm
              .optionValueIds[
              group.id
            ]
        );

      if (
        optionValueIds.some(
          (
            valueId
          ) =>
            !Number.isInteger(
              valueId
            ) ||
            valueId <= 0
        )
      ) {
        await Swal.fire(
          "Select Options",
          "Please select one value for every option group.",
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
          variantOriginalPrice <
            0)
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
        setCreatingVariant(
          true
        );

        setError("");
        setSuccess("");

        const createdVariant =
          await createProductVariant(
            productId,
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

        setVariants(
          (current) => [
            ...current,
            createdVariant,
          ]
        );

        const optionMap: Record<
          number,
          number
        > = {};

        createdVariant.option_values?.forEach(
          (optionValue) => {
            optionMap[
              optionValue.option_group_id
            ] =
              optionValue.id;
          }
        );

        setVariantForms(
          (current) => ({
            ...current,

            [createdVariant.id]:
              {
                price:
                  String(
                    createdVariant.price
                  ),

                originalPrice:
                  createdVariant.original_price !==
                  null
                    ? String(
                        createdVariant.original_price
                      )
                    : "",

                stock:
                  String(
                    createdVariant.stock
                  ),

                sku:
                  createdVariant.sku ||
                  "",

                optionValueIds:
                  optionMap,
              },
          })
        );

        setVariantImages(
          (current) => ({
            ...current,

            [createdVariant.id]:
              [],
          })
        );

        setNewVariantForm({
          price:
            String(
              productPrice
            ),

          originalPrice:
            productOriginalPrice !==
            null
              ? String(
                  productOriginalPrice
                )
              : "",

          stock:
            String(
              productStock
            ),

          sku: "",

          optionValueIds:
            {},
        });

        setSuccess(
          "Variant created successfully."
        );
      } catch (createError) {
        console.error(
          "Create variant error:",
          createError
        );

        setError(
          createError instanceof Error
            ? createError.message
            : "Unable to create variant."
        );
      } finally {
        setCreatingVariant(
          false
        );
      }
    };

  // =========================================================
  // OPEN IMAGE PICKER
  // =========================================================

  const openVariantImagePicker =
    (
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
  // UPLOAD VARIANT IMAGES
  // =========================================================

  const handleVariantImageChange =
    async (
      event: ChangeEvent<HTMLInputElement>,
      variantId: number
    ) => {
      const files =
        Array.from(
          event.target.files ||
            []
        );

      event.target.value =
        "";

      if (
        files.length ===
        0
      ) {
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

      for (
        const file of files
      ) {
        if (
          file.size >
          5 * 1024 * 1024
        ) {
          await Swal.fire(
            "Image Too Large",
            `${file.name} is larger than 5 MB.`,
            "warning"
          );

          return;
        }

        if (
          ![
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ].includes(
            file.type
          )
        ) {
          await Swal.fire(
            "Invalid Image",
            `${file.name} is not a supported image format.`,
            "warning"
          );

          return;
        }
      }

      try {
        for (
          let index = 0;
          index <
          files.length;
          index += 1
        ) {
          const file =
            files[index];

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
                index ===
                  0,
            }
          );
        }

        await loadVariantImages(
          variantId
        );

        setSuccess(
          "Variant images uploaded successfully."
        );
      } catch (uploadError) {
        console.error(
          "Upload variant image error:",
          uploadError
        );

        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Unable to upload variant image."
        );
      } finally {
        setVariantImageAction(
          null
        );
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
      } catch (primaryError) {
        console.error(
          "Set variant primary image error:",
          primaryError
        );

        setError(
          primaryError instanceof Error
            ? primaryError.message
            : "Unable to set variant main image."
        );
      } finally {
        setVariantImageAction(
          null
        );
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

      const result =
        await Swal.fire({
          icon: "warning",

          title:
            "Delete Image?",

          text: "This variant image will be permanently removed.",

          showCancelButton:
            true,

          confirmButtonText:
            "Yes, Delete",

          cancelButtonText:
            "Cancel",
        });

      if (
        !result.isConfirmed
      ) {
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
      } catch (deleteError) {
        console.error(
          "Delete variant image error:",
          deleteError
        );

        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to delete variant image."
        );
      } finally {
        setVariantImageAction(
          null
        );
      }
    };

  // =========================================================
  // VARIANT LABEL
  // =========================================================

  const getVariantLabel =
    (
      variant: ProductVariant
    ) => {
      const form =
        variantForms[
          variant.id
        ];

      if (!form) {
        return `Variant #${variant.id}`;
      }

      const labels =
        optionGroups
          .map(
            (group) => {
              const valueId =
                form
                  .optionValueIds[
                  group.id
                ];

              const value =
                group.values.find(
                  (item) =>
                    item.id ===
                    valueId
                );

              return value
                ? `${group.name}: ${value.value}`
                : null;
            }
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          );

      return labels.length >
        0
        ? labels.join(
            " • "
          )
        : `Variant #${variant.id}`;
    };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* =====================================================
          PRODUCT OPTIONS
      ===================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

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
            onClick={
              addOptionRow
            }
            disabled={
              creatingOption
            }
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Option
          </button>

        </div>

        {/* EXISTING OPTIONS */}

        {loadingOptions ? (
          <div className="mt-6 flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">

            {optionGroups.length ===
            0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-500">
                  No product options have been added yet.
                </p>
              </div>
            ) : (
              optionGroups.map(
                (group) => (
                  <div
                    key={
                      group.id
                    }
                    className="rounded-xl border border-gray-200 p-4"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {
                            group.name
                          }
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.values.map(
                            (
                              value
                            ) => (
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
                          variants.length >
                            0
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* NEW OPTIONS */}

        {newOptionGroups.length >
          0 && (
          <div className="mt-6 space-y-4">

            {newOptionGroups.map(
              (
                option,
                index
              ) => (
                <div
                  key={
                    index
                  }
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
                        onChange={(
                          event
                        ) =>
                          updateOptionRow(
                            index,
                            "name",
                            event
                              .target
                              .value
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
                        onChange={(
                          event
                        ) =>
                          updateOptionRow(
                            index,
                            "values",
                            event
                              .target
                              .value
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
                      className="self-end rounded-lg bg-red-50 p-2.5 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* =====================================================
          ADD VARIANT
      ===================================================== */}

      {optionGroups.length >
        0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

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
                      newVariantForm
                        .optionValueIds[
                        group.id
                      ] ??
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateNewVariantOption(
                        group.id,
                        Number(
                          event
                            .target
                            .value
                        )
                      )
                    }
                    disabled={
                      creatingVariant
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

            {/* SKU */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                SKU
              </label>

              <input
                type="text"
                value={
                  newVariantForm.sku
                }
                onChange={(
                  event
                ) =>
                  setNewVariantForm(
                    (
                      current
                    ) => ({
                      ...current,
                      sku:
                        event
                          .target
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

            {/* PRICE */}

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
                onChange={(
                  event
                ) =>
                  setNewVariantForm(
                    (
                      current
                    ) => ({
                      ...current,
                      price:
                        event
                          .target
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

            {/* ORIGINAL PRICE */}

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
                onChange={(
                  event
                ) =>
                  setNewVariantForm(
                    (
                      current
                    ) => ({
                      ...current,
                      originalPrice:
                        event
                          .target
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

            {/* STOCK */}

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
                onChange={(
                  event
                ) =>
                  setNewVariantForm(
                    (
                      current
                    ) => ({
                      ...current,
                      stock:
                        event
                          .target
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
              creatingVariant
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

      {/* =====================================================
          EXISTING VARIANTS
      ===================================================== */}

      {optionGroups.length >
        0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

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
              {variants.length ===
              1
                ? "variant"
                : "variants"}
            </span>

          </div>

          {loadingVariants ? (
            <div className="mt-8 flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-gray-500" />
            </div>
          ) : variants.length ===
            0 ? (
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
                              null
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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

                      {/* VARIANT FORM */}

                      {form && (
                        <div className="mt-5 grid gap-5 sm:grid-cols-2">

                          {optionGroups.map(
                            (
                              group
                            ) => (
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
                                        event
                                          .target
                                          .value
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

                          {/* SKU */}

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
                                  event
                                    .target
                                    .value
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

                          {/* PRICE */}

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
                                  event
                                    .target
                                    .value
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

                          {/* ORIGINAL PRICE */}

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
                                  event
                                    .target
                                    .value
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

                          {/* STOCK */}

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
                                  event
                                    .target
                                    .value
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
                            null
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

                      {/* =================================================
                          VARIANT IMAGES
                      ================================================= */}

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
                          ref={(
                            element
                          ) => {
                            variantFileInputRefs.current[
                              variant.id
                            ] =
                              element;
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          onChange={(
                            event
                          ) =>
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
                        ) : images.length ===
                          0 ? (
                          <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                            <p className="text-sm text-gray-500">
                              No images for this variant yet.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

                            {images.map(
                              (
                                image
                              ) => (
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
                                        image.is_primary
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
                                        null
                                      }
                                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* =====================================================
          NO OPTIONS
      ===================================================== */}

      {!loadingOptions &&
        optionGroups.length ===
          0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">

              <h2 className="text-lg font-semibold text-gray-900">
                No Variants
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
                This product currently has no options or variants.
                Add options above, such as Color, Size, RAM,
                Storage, Capacity, or Material.
              </p>

            </div>

          </section>
        )}

    </div>
  );
}