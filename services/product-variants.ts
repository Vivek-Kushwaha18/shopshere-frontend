import { apiFetch } from "./api";

// =====================================================
// TYPES
// =====================================================

export interface ProductVariantOptionValue {
  id: number;
  option_group_id: number;
  value: string;
}

export interface ProductVariantImage {
  id: number;
  image_url: string;
  view_type: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  is_active: boolean;
  option_value_ids: number[];
  option_values?: ProductVariantOptionValue[];
  images?: ProductVariantImage[];
}

export interface CreateProductVariant {
  sku?: string | null;
  price: number;
  original_price?: number | null;
  stock: number;
  option_value_ids: number[];
}

export interface UpdateProductVariant {
  sku?: string | null;
  price?: number;
  original_price?: number | null;
  stock?: number;
  is_active?: boolean;
  option_value_ids?: number[];
}

// =====================================================
// CREATE VARIANT
// =====================================================

export async function createProductVariant(
  productId: number,
  data: CreateProductVariant
): Promise<ProductVariant> {
  if (productId <= 0) {
    throw new Error("Invalid product.");
  }

  if (
    !data.option_value_ids ||
    data.option_value_ids.length === 0
  ) {
    throw new Error(
      "At least one option value is required."
    );
  }

  if (data.price < 0) {
    throw new Error(
      "Variant price cannot be negative."
    );
  }

  if (data.stock < 0) {
    throw new Error(
      "Variant stock cannot be negative."
    );
  }

  const response = await apiFetch(
    `/api/products/${productId}/variants`,
    {
      method: "POST",
      body: JSON.stringify({
        sku:
          data.sku?.trim() || null,

        price: data.price,

        original_price:
          data.original_price ?? null,

        stock: data.stock,

        option_value_ids:
          data.option_value_ids,
      }),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to create product variant."
    );
  }

  return response.data as ProductVariant;
}

// =====================================================
// GET PRODUCT VARIANTS
// =====================================================

export async function getProductVariants(
  productId: number
): Promise<ProductVariant[]> {
  if (productId <= 0) {
    throw new Error("Invalid product.");
  }

  const response = await apiFetch(
    `/api/products/${productId}/variants`
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to fetch product variants."
    );
  }

  return response.data as ProductVariant[];
}

// =====================================================
// GET SINGLE VARIANT
// =====================================================

export async function getProductVariant(
  variantId: number
): Promise<ProductVariant> {
  if (variantId <= 0) {
    throw new Error(
      "Invalid product variant."
    );
  }

  const response = await apiFetch(
    `/api/products/variants/${variantId}`
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to fetch product variant."
    );
  }

  return response.data as ProductVariant;
}

// =====================================================
// UPDATE VARIANT
// =====================================================

export async function updateProductVariant(
  variantId: number,
  data: UpdateProductVariant
): Promise<ProductVariant> {
  if (variantId <= 0) {
    throw new Error(
      "Invalid product variant."
    );
  }

  const response = await apiFetch(
    `/api/products/variants/${variantId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        ...(data.sku !== undefined && {
          sku:
            data.sku?.trim() || null,
        }),

        ...(data.price !== undefined && {
          price: data.price,
        }),

        ...(data.original_price !== undefined && {
          original_price:
            data.original_price,
        }),

        ...(data.stock !== undefined && {
          stock: data.stock,
        }),

        ...(data.is_active !== undefined && {
          is_active: data.is_active,
        }),

        ...(data.option_value_ids !==
          undefined && {
          option_value_ids:
            data.option_value_ids,
        }),
      }),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to update product variant."
    );
  }

  return response.data as ProductVariant;
}

// =====================================================
// DELETE VARIANT
// =====================================================

export async function deleteProductVariant(
  variantId: number
): Promise<void> {
  if (variantId <= 0) {
    throw new Error(
      "Invalid product variant."
    );
  }

  const response = await apiFetch(
    `/api/products/variants/${variantId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to delete product variant."
    );
  }
}