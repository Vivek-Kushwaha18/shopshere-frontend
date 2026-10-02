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

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: CartProduct;
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
  data: {
    success: boolean;
    data: CartData;
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
    throw new Error("Unable to load cart.");
  }

  if (!response.data?.success) {
    throw new Error("Unable to load cart data.");
  }

  return response.data.data;
}

export async function addToCart(
  productId: number,
  quantity: number = 1
) {
  return apiFetch(
    `/api/cart/items?product_id=${productId}&quantity=${quantity}`,
    {
      method: "POST",
    }
  );
}

export async function updateCartItem(
  itemId: number,
  quantity: number
) {
  return apiFetch(
    `/api/cart/items/${itemId}?quantity=${quantity}`,
    {
      method: "PATCH",
    }
  );
}

export async function removeCartItem(
  itemId: number
) {
  return apiFetch(
    `/api/cart/items/${itemId}`,
    {
      method: "DELETE",
    }
  );
}

export async function clearCart() {
  return apiFetch(
    "/api/cart/",
    {
      method: "DELETE",
    }
  );
}