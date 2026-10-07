import { apiFetch } from "./api";

// =====================================================
// TYPES
// =====================================================

export interface ProductVariantImage {
  id: number;
  variant_id: number;
  image_url: string;
  view_type: string | null;
  sort_order: number;
  is_primary: boolean;
}

// =====================================================
// GET VARIANT IMAGES
// =====================================================

export async function getProductVariantImages(
  variantId: number
): Promise<ProductVariantImage[]> {
  if (variantId <= 0) {
    throw new Error(
      "Invalid product variant."
    );
  }

  const response = await apiFetch(
    `/api/products/variants/${variantId}/images`
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to fetch variant images."
    );
  }

  return response.data as ProductVariantImage[];
}

// =====================================================
// UPLOAD VARIANT IMAGE
// =====================================================

export async function uploadProductVariantImage(
  variantId: number,
  file: File,
  options?: {
    viewType?: string;
    sortOrder?: number;
    isPrimary?: boolean;
  }
): Promise<ProductVariantImage> {
  if (variantId <= 0) {
    throw new Error(
      "Invalid product variant."
    );
  }

  if (!file) {
    throw new Error(
      "Image file is required."
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Unsupported image format."
    );
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    throw new Error(
      "Image must be 5 MB or smaller."
    );
  }

  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  if (options?.viewType) {
    formData.append(
      "view_type",
      options.viewType
    );
  }

  if (
    options?.sortOrder !== undefined
  ) {
    formData.append(
      "sort_order",
      String(options.sortOrder)
    );
  }

  if (
    options?.isPrimary !== undefined
  ) {
    formData.append(
      "is_primary",
      String(options.isPrimary)
    );
  }

  const response = await apiFetch(
    `/api/products/variants/${variantId}/images`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to upload variant image."
    );
  }

  return response.data as ProductVariantImage;
}

// =====================================================
// SET PRIMARY IMAGE
// =====================================================

export async function setProductVariantPrimaryImage(
  variantId: number,
  imageId: number
): Promise<ProductVariantImage> {
  if (variantId <= 0) {
    throw new Error(
      "Invalid product variant."
    );
  }

  if (imageId <= 0) {
    throw new Error(
      "Invalid image."
    );
  }

  const response = await apiFetch(
    `/api/products/variants/${variantId}/images/${imageId}/primary`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to set primary image."
    );
  }

  return response.data as ProductVariantImage;
}

// =====================================================
// DELETE VARIANT IMAGE
// =====================================================

export async function deleteProductVariantImage(
  variantId: number,
  imageId: number
): Promise<void> {
  if (variantId <= 0) {
    throw new Error(
      "Invalid product variant."
    );
  }

  if (imageId <= 0) {
    throw new Error(
      "Invalid image."
    );
  }

  const response = await apiFetch(
    `/api/products/variants/${variantId}/images/${imageId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to delete variant image."
    );
  }
}