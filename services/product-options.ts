import { apiFetch } from "./api";

// =====================================================
// TYPES
// =====================================================

export interface ProductOptionValue {
  id: number;
  option_group_id: number;
  value: string;
  sort_order: number;
}

export interface ProductOptionGroup {
  id: number;
  product_id: number;
  name: string;
  sort_order: number;
  values: ProductOptionValue[];
}

export interface CreateProductOptionValue {
  value: string;
  sort_order?: number;
}

export interface CreateProductOptionGroup {
  name: string;
  sort_order?: number;
  values: CreateProductOptionValue[];
}

// =====================================================
// CREATE OPTION GROUP
// =====================================================

export async function createProductOption(
  productId: number,
  data: CreateProductOptionGroup
): Promise<ProductOptionGroup> {
  if (productId <= 0) {
    throw new Error("Invalid product.");
  }

  if (!data.name.trim()) {
    throw new Error("Option name is required.");
  }

  if (!data.values || data.values.length === 0) {
    throw new Error(
      "At least one option value is required."
    );
  }

  const response = await apiFetch(
    `/api/products/${productId}/options`,
    {
      method: "POST",
      body: JSON.stringify({
        name: data.name.trim(),
        sort_order: data.sort_order ?? 0,
        values: data.values.map(
          (item, index) => ({
            value: item.value.trim(),
            sort_order:
              item.sort_order ?? index,
          })
        ),
      }),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to create product option."
    );
  }

  return response.data as ProductOptionGroup;
}

// =====================================================
// GET PRODUCT OPTIONS
// =====================================================

export async function getProductOptions(
  productId: number
): Promise<ProductOptionGroup[]> {
  if (productId <= 0) {
    throw new Error("Invalid product.");
  }

  const response = await apiFetch(
    `/api/products/${productId}/options`
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to fetch product options."
    );
  }

  return response.data as ProductOptionGroup[];
}

// =====================================================
// DELETE OPTION GROUP
// =====================================================

export async function deleteProductOption(
  optionGroupId: number
): Promise<void> {
  if (optionGroupId <= 0) {
    throw new Error(
      "Invalid option group."
    );
  }

  const response = await apiFetch(
    `/api/products/options/${optionGroupId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to delete product option."
    );
  }
}