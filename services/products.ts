import { apiFetch } from "./api";

// =====================================================
// PRODUCT IMAGE
// =====================================================

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
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

  // Frontend main image
  image?: string | null;

  rating?: number;
  reviews_count?: number;

  is_active?: boolean;
  is_deleted?: boolean;

  created_at?: string;
  updated_at?: string;

  // All product images
  images?: ProductImage[];
}

// =====================================================
// NORMALIZE PRODUCT
// Backend image_url -> frontend image
// =====================================================

function normalizeProduct(
  product: any
): Product {
  return {
    id: product.id,

    seller_id: product.seller_id,

    category_id: product.category_id,

    name: product.name,

    slug: product.slug,

    description:
      product.description ?? null,

    price:
      Number(product.price),

    original_price:
      product.original_price != null
        ? Number(
            product.original_price
          )
        : null,

    stock:
      Number(product.stock),

    image:
      product.image_url ?? null,

    rating:
      product.rating != null
        ? Number(product.rating)
        : 0,

    reviews_count:
      product.reviews_count != null
        ? Number(
            product.reviews_count
          )
        : 0,

    is_active:
      product.is_active ?? true,

    is_deleted:
      product.is_deleted ?? false,

    created_at:
      product.created_at,

    updated_at:
      product.updated_at,

    images:
      Array.isArray(product.images)
        ? product.images
        : [],
  };
}

// =====================================================
// PRODUCT CACHE
// Keeps products available during navigation
// =====================================================

let productsCache: Product[] | null =
  null;

let productsRequest:
  Promise<Product[]> | null = null;

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
      const response =
        await apiFetch(
          "/api/products/"
        );

      if (!response.success) {
        throw new Error(
          response.data?.detail ||
            "Unable to fetch products."
        );
      }

      if (!Array.isArray(response.data)) {
        throw new Error(
          "Invalid products response."
        );
      }

      const products =
        response.data.map(
          normalizeProduct
        );

      productsCache = products;

      return products;
    } finally {
      productsRequest = null;
    }
  })();

  return productsRequest;
}

// =====================================================
// GET SINGLE PRODUCT BY SLUG
// =====================================================

export async function getProduct(
  productSlug: string
): Promise<Product> {
  const response =
    await apiFetch(
      `/api/products/slug/${productSlug}`
    );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch product."
    );
  }

  return normalizeProduct(
    response.data
  );
}

// =====================================================
// GET SELLER PRODUCTS
// =====================================================

export async function getMyProducts(): Promise<Product[]> {
  const response =
    await apiFetch(
      "/api/products/seller/my-products"
    );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch your products."
    );
  }

  if (!Array.isArray(response.data)) {
    throw new Error(
      "Invalid products response."
    );
  }

  return response.data.map(
    normalizeProduct
  );
}

// =====================================================
// GET PRODUCTS BY CATEGORY SLUG
// =====================================================

export async function getProductsByCategory(
  categorySlug: string
): Promise<Product[]> {
  const response =
    await apiFetch(
      `/api/products/category/${categorySlug}`
    );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch category products."
    );
  }

  if (!Array.isArray(response.data)) {
    throw new Error(
      "Invalid products response."
    );
  }

  return response.data.map(
    normalizeProduct
  );
}

// =====================================================
// CREATE PRODUCT
// =====================================================

export async function createProduct(
  formData: FormData
): Promise<Product> {
  const response =
    await apiFetch(
      "/api/products/",
      {
        method: "POST",
        body: formData,
      }
    );

  if (!response.success) {
    const detail =
      response.data?.detail;

    if (Array.isArray(detail)) {
      const message =
        detail
          .map(
            (item: any) =>
              item?.msg ||
              "Validation error"
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

  return normalizeProduct(
    response.data
  );
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

  // Frontend field
  image?: string | null;

  // Kept for compatibility with
  // older code
  image_url?: string | null;
}

export async function updateProduct(
  productId: number,
  data: ProductUpdateData
): Promise<Product> {
  const backendData = {
    name: data.name,

    description:
      data.description,

    price: data.price,

    original_price:
      data.original_price,

    stock: data.stock,

    category_id:
      data.category_id,

    // Backend expects image_url
    image_url:
      data.image ??
      data.image_url ??
      null,
  };

  const response =
    await apiFetch(
      `/api/products/${productId}`,
      {
        method: "PUT",
        body: JSON.stringify(
          backendData
        ),
      }
    );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update product."
    );
  }

  productsCache = null;

  return normalizeProduct(
    response.data
  );
}

// =====================================================
// UPDATE STOCK
// =====================================================

export async function updateProductStock(
  productId: number,
  stock: number
): Promise<Product> {
  const response =
    await apiFetch(
      `/api/products/${productId}/stock`,
      {
        method: "PATCH",
        body: JSON.stringify({
          stock,
        }),
      }
    );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update stock."
    );
  }

  productsCache = null;

  return normalizeProduct(
    response.data
  );
}

// =====================================================
// ACTIVATE PRODUCT
// =====================================================

export async function activateProduct(
  productId: number
): Promise<Product> {
  const response =
    await apiFetch(
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

  return normalizeProduct(
    response.data
  );
}

// =====================================================
// DEACTIVATE PRODUCT
// =====================================================

export async function deactivateProduct(
  productId: number
): Promise<Product> {
  const response =
    await apiFetch(
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

  return normalizeProduct(
    response.data
  );
}

// =====================================================
// DELETE PRODUCT
// =====================================================

export async function deleteProduct(
  productId: number
): Promise<void> {
  const response =
    await apiFetch(
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
  const response =
    await apiFetch(
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

  return normalizeProduct(
    response.data
  );
}

// =====================================================
// REPLACE ALL PRODUCT IMAGES
// =====================================================

export async function replaceProductImages(
  productId: number,
  formData: FormData
): Promise<Product> {
  const response =
    await apiFetch(
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

  return normalizeProduct(
    response.data
  );
}

// =====================================================
// DELETE ONE PRODUCT IMAGE
// =====================================================

export async function deleteProductImage(
  productId: number,
  imageId: number
): Promise<void> {
  const response =
    await apiFetch(
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