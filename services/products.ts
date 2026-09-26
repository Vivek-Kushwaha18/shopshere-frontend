import { apiFetch } from "./api";

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

export interface Product {
  id: number;

  seller_id: number;

  category_id: number;

  name: string;

  description?: string | null;

  price: number;

  original_price?: number | null;

  stock: number;

  image_url?: string | null;

  rating?: number;

  reviews_count?: number;

  is_active?: boolean;

  is_deleted?: boolean;

  created_at?: string;

  updated_at?: string;

  images?: ProductImage[];
}


// =====================================================
// GET ALL PRODUCTS
// =====================================================

export async function getProducts(): Promise<Product[]> {
  const response = await apiFetch(
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

  return response.data as Product[];
}


// =====================================================
// GET SINGLE PRODUCT
// =====================================================

export async function getProduct(
  productId: number
): Promise<Product> {
  const response = await apiFetch(
    `/api/products/${productId}`
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch product."
    );
  }

  return response.data as Product;
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
    throw new Error(
      "Invalid products response."
    );
  }

  return response.data as Product[];
}


// =====================================================
// GET PRODUCTS BY CATEGORY
// =====================================================

export async function getProductsByCategory(
  categoryId: number
): Promise<Product[]> {
  const response = await apiFetch(
    `/api/products/category/${categoryId}`
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

  return response.data as Product[];
}


// =====================================================
// CREATE PRODUCT
// =====================================================

export async function createProduct(
  formData: FormData
): Promise<Product> {
  const response = await apiFetch(
    "/api/products/",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to create product."
    );
  }

  return response.data as Product;
}


// =====================================================
// UPDATE PRODUCT
// =====================================================

export async function updateProduct(
  productId: number,
  data: {
    name?: string;
    description?: string | null;
    price?: number;
    original_price?: number | null;
    stock?: number;
    category_id?: number;
    image_url?: string | null;
  }
): Promise<Product> {
  const response = await apiFetch(
    `/api/products/${productId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update product."
    );
  }

  return response.data as Product;
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

  return response.data as Product;
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

  return response.data as Product;
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

  return response.data as Product;
}


// =====================================================
// DELETE PRODUCT
// =====================================================

export async function deleteProduct(
  productId: number
): Promise<Product> {
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

  return response.data as Product;
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

  return response.data as Product;
}