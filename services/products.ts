
import { apiFetch } from "./api";

// =====================================================
// PRODUCT IMAGE
// =====================================================

export interface ProductImage {
  id: number;
  image_url: string;
  variant_id?: number | null;
  view_type?: string | null;
  sort_order: number;
  is_primary: boolean;
}

// =====================================================
// PRODUCT OPTION VALUE
// =====================================================

export interface ProductOptionValue {
  id: number;
  option_group_id: number;
  value: string;
  sort_order: number;
}

// =====================================================
// PRODUCT OPTION GROUP
// =====================================================

export interface ProductOptionGroup {
  id: number;
  product_id: number;
  name: string;
  sort_order: number;
  values: ProductOptionValue[];
}

// =====================================================
// PRODUCT VARIANT
// =====================================================

export interface ProductVariant {
  id: number;
  product_id: number;
  sku?: string | null;
  price: number;
  original_price?: number | null;
  stock: number;
  is_active: boolean;
  option_value_ids: number[];
  images: ProductImage[];
}

// =====================================================
// PRODUCT
// =====================================================

export interface Product {
  id: number;
  seller_id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  stock: number;
  image?: string | null;
  rating?: number;
  reviews_count?: number;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  images?: ProductImage[];
  option_groups?: ProductOptionGroup[];
  variants?: ProductVariant[];
}

// =====================================================
// NORMALIZE PRODUCT
// Backend response -> frontend Product
// =====================================================

function normalizeProduct(product: any): Product {
  const variants: ProductVariant[] = Array.isArray(
    product?.variants
  )
    ? product.variants.map((variant: any) => ({
        id: Number(variant.id),
        product_id: Number(variant.product_id),
        sku: variant.sku ?? null,
        price: Number(variant.price ?? 0),
        original_price:
          variant.original_price != null
            ? Number(variant.original_price)
            : null,
        stock: Number(variant.stock ?? 0),
        is_active: variant.is_active ?? true,
        option_value_ids: Array.isArray(
          variant.option_value_ids
        )
          ? variant.option_value_ids.map((id: any) =>
              Number(id)
            )
          : [],
        images: Array.isArray(variant.images)
          ? variant.images.map((image: any) => ({
              id: Number(image.id),
              image_url: String(image.image_url ?? ""),
              variant_id:
                image.variant_id != null
                  ? Number(image.variant_id)
                  : null,
              view_type: image.view_type ?? null,
              sort_order: Number(image.sort_order ?? 0),
              is_primary: image.is_primary ?? false,
            }))
          : [],
      }))
    : [];

  const optionGroups: ProductOptionGroup[] = Array.isArray(
    product?.option_groups
  )
    ? product.option_groups.map((group: any) => ({
        id: Number(group.id),
        product_id: Number(group.product_id),
        name: String(group.name ?? ""),
        sort_order: Number(group.sort_order ?? 0),
        values: Array.isArray(group.values)
          ? group.values.map((value: any) => ({
              id: Number(value.id),
              option_group_id: Number(
                value.option_group_id
              ),
              value: String(value.value ?? ""),
              sort_order: Number(
                value.sort_order ?? 0
              ),
            }))
          : [],
      }))
    : [];

  const images: ProductImage[] = Array.isArray(
    product?.images
  )
    ? product.images.map((image: any) => ({
        id: Number(image.id),
        image_url: String(image.image_url ?? ""),
        variant_id:
          image.variant_id != null
            ? Number(image.variant_id)
            : null,
        view_type: image.view_type ?? null,
        sort_order: Number(image.sort_order ?? 0),
        is_primary: image.is_primary ?? false,
      }))
    : [];

  return {
    id: Number(product?.id),
    seller_id: Number(product?.seller_id),
    category_id: Number(product?.category_id),
    name: String(product?.name ?? ""),
    slug: String(product?.slug ?? "").trim(),
    description: product?.description ?? null,
    price: Number(product?.price ?? 0),
    original_price:
      product?.original_price != null
        ? Number(product.original_price)
        : null,
    stock: Number(product?.stock ?? 0),
    image: product?.image_url ?? product?.image ?? null,
    rating:
      product?.rating != null
        ? Number(product.rating)
        : 0,
    reviews_count:
      product?.reviews_count != null
        ? Number(product.reviews_count)
        : 0,
    is_active: product?.is_active ?? true,
    is_deleted: product?.is_deleted ?? false,
    created_at: product?.created_at,
    updated_at: product?.updated_at,
    images,
    option_groups: optionGroups,
    variants,
  };
}

// =====================================================
// PRODUCT CACHE
// =====================================================

let productsCache: Product[] | null = null;
let productsRequest: Promise<Product[]> | null = null;

// Share simultaneous requests for the same product identifier.
const productRequests = new Map<
  string,
  Promise<Product>
>();

// Share simultaneous requests for the same category slug.
const categoryProductsRequests = new Map<
  string,
  Promise<Product[]>
>();

// =====================================================
// GET ALL PRODUCTS
// =====================================================

export async function getProducts(): Promise<Product[]> {
  if (productsCache !== null) {
    return productsCache;
  }

  if (productsRequest !== null) {
    return productsRequest;
  }

  productsRequest = (async () => {
    try {
      const response = await apiFetch("/api/products/");

      if (!response.success) {
        throw new Error(
          response.data?.detail ||
            "Unable to fetch products."
        );
      }

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid products response.");
      }

      const products = response.data.map(normalizeProduct);

      productsCache = products;

      return products;
    } finally {
      productsRequest = null;
    }
  })();

  return productsRequest;
}

// =====================================================
// GET SINGLE PRODUCT BY SLUG OR NUMERIC ID
// =====================================================

export async function getProduct(
  productSlug: string
): Promise<Product> {
  const identifier = String(productSlug ?? "").trim();

  if (!identifier) {
    throw new Error("Product slug or ID is required.");
  }

  const existingRequest = productRequests.get(identifier);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async (): Promise<Product> => {
    try {
      // First, try the existing backend slug endpoint.
      let slugError: unknown;

      try {
        const response = await apiFetch(
          `/api/products/slug/${encodeURIComponent(
            identifier
          )}`
        );

        if (response.success && response.data) {
          const product = normalizeProduct(response.data);

          if (
            product.id > 0 &&
            product.slug &&
            !product.is_deleted &&
            product.is_active
          ) {
            return product;
          }
        } else {
          slugError = new Error(
            response.data?.detail ||
              "Product slug lookup failed."
          );
        }
      } catch (error) {
        slugError = error;
      }

      // Fallback: look for the slug or ID in the public list.
      const products = await getProducts();

      const product = products.find(
        (item) =>
          item.slug === identifier ||
          String(item.id) === identifier
      );

      if (product) {
        if (product.is_deleted || !product.is_active) {
          throw new Error(
            "This product is not currently available."
          );
        }

        return product;
      }

      if (slugError instanceof Error) {
        throw new Error(
          `Product not found for "${identifier}". ${slugError.message}`
        );
      }

      throw new Error(
        `Product not found for "${identifier}".`
      );
    } finally {
      productRequests.delete(identifier);
    }
  })();

  productRequests.set(identifier, request);

  return request;
}

// =====================================================
// GET SELLER PRODUCTS
// =====================================================

export async function getMyProducts(): Promise<Product[]> {
  const response = await apiFetch(
    "/api/products/seller/my-products"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch your products."
    );
  }

  if (!Array.isArray(response.data)) {
    throw new Error("Invalid products response.");
  }

  return response.data.map(normalizeProduct);
}

// =====================================================
// GET PRODUCTS BY CATEGORY SLUG
// =====================================================

export async function getProductsByCategory(
  categorySlug: string
): Promise<Product[]> {
  const slug = categorySlug.trim();

  if (!slug) {
    throw new Error("Category slug is required.");
  }

  const existingRequest =
    categoryProductsRequests.get(slug);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async (): Promise<Product[]> => {
    try {
      const response = await apiFetch(
        `/api/products/category/${encodeURIComponent(
          slug
        )}`
      );

      if (!response.success) {
        throw new Error(
          response.data?.detail ||
            "Unable to fetch category products."
        );
      }

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid products response.");
      }

      return response.data.map(normalizeProduct);
    } finally {
      categoryProductsRequests.delete(slug);
    }
  })();

  categoryProductsRequests.set(slug, request);

  return request;
}

// =====================================================
// CREATE PRODUCT
// =====================================================

export async function createProduct(
  formData: FormData
): Promise<Product> {
  const response = await apiFetch("/api/products/", {
    method: "POST",
    body: formData,
  });

  if (!response.success) {
    const detail = response.data?.detail;

    if (Array.isArray(detail)) {
      const message = detail
        .map(
          (item: any) =>
            item?.msg || "Validation error"
        )
        .join(", ");

      throw new Error(message);
    }

    throw new Error(
      typeof detail === "string"
        ? detail
        : "Unable to create product."
    );
  }

  productsCache = null;

  return normalizeProduct(response.data);
}

// =====================================================
// UPDATE PRODUCT
// =====================================================

export interface ProductUpdateData {
  name?: string;
  description?: string | null;
  price?: number;
  original_price?: number | null;
  stock?: number;
  category_id?: number;
  image?: string | null;
  image_url?: string | null;
}

export async function updateProduct(
  productId: number,
  data: ProductUpdateData
): Promise<Product> {
  const backendData = {
    name: data.name,
    description: data.description,
    price: data.price,
    original_price: data.original_price,
    stock: data.stock,
    category_id: data.category_id,
    image_url: data.image ?? data.image_url ?? null,
  };

  const response = await apiFetch(
    `/api/products/${productId}`,
    {
      method: "PUT",
      body: JSON.stringify(backendData),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update product."
    );
  }

  productsCache = null;

  return normalizeProduct(response.data);
}

// =====================================================
// UPDATE STOCK
// =====================================================

export async function updateProductStock(
  productId: number,
  stock: number
): Promise<Product> {
  const response = await apiFetch(
    `/api/products/${productId}/stock`,
    {
      method: "PATCH",
      body: JSON.stringify({ stock }),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update stock."
    );
  }

  productsCache = null;

  return normalizeProduct(response.data);
}

// =====================================================
// ACTIVATE PRODUCT
// =====================================================

export async function activateProduct(
  productId: number
): Promise<Product> {
  const response = await apiFetch(
    `/api/products/${productId}/activate`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to activate product."
    );
  }

  productsCache = null;

  return normalizeProduct(response.data);
}

// =====================================================
// DEACTIVATE PRODUCT
// =====================================================

export async function deactivateProduct(
  productId: number
): Promise<Product> {
  const response = await apiFetch(
    `/api/products/${productId}/deactivate`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to deactivate product."
    );
  }

  productsCache = null;

  return normalizeProduct(response.data);
}

// =====================================================
// DELETE PRODUCT
// =====================================================

export async function deleteProduct(
  productId: number
): Promise<void> {
  const response = await apiFetch(
    `/api/products/${productId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to delete product."
    );
  }

  productsCache = null;
}

// =====================================================
// SET PRIMARY PRODUCT IMAGE
// =====================================================

export async function setPrimaryProductImage(
  productId: number,
  imageId: number
): Promise<Product> {
  const response = await apiFetch(
    `/api/products/${productId}/images/${imageId}/primary`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to change primary image."
    );
  }

  productsCache = null;

  return normalizeProduct(response.data);
}

// =====================================================
// REPLACE ALL PRODUCT IMAGES
// =====================================================

export async function replaceProductImages(
  productId: number,
  formData: FormData
): Promise<Product> {
  const response = await apiFetch(
    `/api/products/${productId}/images`,
    {
      method: "PUT",
      body: formData,
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to replace product images."
    );
  }

  productsCache = null;

  return normalizeProduct(response.data);
}

// =====================================================
// DELETE ONE PRODUCT IMAGE
// =====================================================

export async function deleteProductImage(
  productId: number,
  imageId: number
): Promise<void> {
  const response = await apiFetch(
    `/api/products/${productId}/images/${imageId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to delete product image."
    );
  }

  productsCache = null;
}
