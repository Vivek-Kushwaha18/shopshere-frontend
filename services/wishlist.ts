import { apiFetch } from "./api";

// =====================================================
// WISHLIST PRODUCT
// =====================================================

export interface WishlistProduct {
  id: number;
  name: string;
  slug: string;
  description?: string | null;

  price: number;
  original_price?: number | null;

  stock: number;

  image_url?: string | null;

  rating?: number;
  reviews_count?: number;
}

// =====================================================
// WISHLIST ITEM
// =====================================================

export interface WishlistItem {
  id: number;
  product_id: number;
  created_at: string;

  product: WishlistProduct;
}

// =====================================================
// GET WISHLIST
// =====================================================

export async function getWishlist(): Promise<
  WishlistItem[]
> {
  const response = await apiFetch(
    "/api/wishlist/"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch wishlist."
    );
  }

  const items =
    response.data?.data?.items;

  if (!Array.isArray(items)) {
    throw new Error(
      "Invalid wishlist response."
    );
  }

  return items;
}

// =====================================================
// ADD TO WISHLIST
// =====================================================

export async function addToWishlist(
  productId: number
): Promise<{
  wishlist_id: number;
  product_id: number;
}> {
  const response = await apiFetch(
    `/api/wishlist/${productId}`,
    {
      method: "POST",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to add product to wishlist."
    );
  }

  return response.data.data;
}

// =====================================================
// REMOVE FROM WISHLIST
// =====================================================

export async function removeFromWishlist(
  productId: number
): Promise<void> {
  const response = await apiFetch(
    `/api/wishlist/${productId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to remove product from wishlist."
    );
  }
}

// =====================================================
// CHECK WISHLIST
// =====================================================

export async function checkWishlist(
  productId: number
): Promise<{
  product_id: number;
  is_wishlisted: boolean;
  wishlist_id: number | null;
}> {
  const response = await apiFetch(
    `/api/wishlist/check/${productId}`
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to check wishlist."
    );
  }

  return response.data.data;
}