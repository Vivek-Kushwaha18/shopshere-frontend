import { apiFetch } from "./api";

export interface CartProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  image_url: string | null;
  rating: number;
  reviews_count: number;
}

export interface CartVariantOptionValue {
  id: number;
  option_group_id: number;
  value: string;
}

export interface CartVariantImage {
  id: number;
  image_url: string;
  view_type: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface CartVariant {
  id: number;
  sku: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  is_active: boolean;
  option_values: CartVariantOptionValue[];
  images: CartVariantImage[];
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  product: CartProduct;
  variant: CartVariant | null;
  item_total: number;
}

export interface CartData {
  cart_id: number;
  items: CartItem[];
  total_items: number;
  total: number;
}

interface ApiCartResponse {
  success: boolean;
  status: number;
  data?: {
    success?: boolean;
    data?: CartData;
    detail?: string;
    message?: string;
  };
}

interface ApiResponse {
  success: boolean;
  status: number;
  data?: {
    detail?: string;
    message?: string;
  };
}

export async function getCart(): Promise<CartData> {
  const response =
    (await apiFetch("/api/cart/")) as ApiCartResponse;

  if (response.status === 401) {
    return {
      cart_id: 0,
      items: [],
      total_items: 0,
      total: 0,
    };
  }

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to load your cart."
    );
  }

  if (!response.data?.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to load cart data."
    );
  }

  if (!response.data.data) {
    throw new Error("Invalid cart response.");
  }

  return response.data.data;
}

export async function addToCart(
  productId: number,
  quantity: number = 1,
  variantId: number | null = null
): Promise<ApiResponse> {
  if (productId <= 0) {
    throw new Error("Invalid product.");
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }

  if (variantId !== null && variantId <= 0) {
    throw new Error("Invalid product variant.");
  }

  const params = new URLSearchParams();

  params.set(
    "product_id",
    String(productId)
  );

  params.set(
    "quantity",
    String(quantity)
  );

  if (variantId !== null) {
    params.set(
      "variant_id",
      String(variantId)
    );
  }

  const response = (await apiFetch(
    `/api/cart/items?${params.toString()}`,
    {
      method: "POST",
    }
  )) as ApiResponse;

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to add product to cart."
    );
  }

  return response;
}

export async function updateCartItem(
  itemId: number,
  quantity: number
): Promise<ApiResponse> {
  if (itemId <= 0) {
    throw new Error("Invalid cart item.");
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }

  const response = (await apiFetch(
    `/api/cart/items/${itemId}?quantity=${quantity}`,
    {
      method: "PATCH",
    }
  )) as ApiResponse;

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to update cart item."
    );
  }

  return response;
}

export async function removeCartItem(
  itemId: number
): Promise<ApiResponse> {
  if (itemId <= 0) {
    throw new Error("Invalid cart item.");
  }

  const response = (await apiFetch(
    `/api/cart/items/${itemId}`,
    {
      method: "DELETE",
    }
  )) as ApiResponse;

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to remove cart item."
    );
  }

  return response;
}

export async function clearCart(): Promise<ApiResponse> {
  const response = (await apiFetch(
    "/api/cart/",
    {
      method: "DELETE",
    }
  )) as ApiResponse;

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Unable to clear cart."
    );
  }

  return response;
}