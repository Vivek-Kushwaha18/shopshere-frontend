import { apiFetch } from "@/services/api";

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewData {
  product_id: number;
  rating: number;
  comment: string;
}

export interface UpdateReviewData {
  rating: number;
  comment: string;
}

interface ApiResponse<T> {
  success: boolean;
  status: number;
  data: T;
  message?: string;
}

/**
 * Get all reviews for a product
 */
export async function getProductReviews(
  productId: number
): Promise<Review[]> {
  const response = (await apiFetch(
    `/reviews/product/${productId}`
  )) as ApiResponse<Review[]>;

  if (!response.success) {
    throw new Error(
      response.message ||
        "Unable to load product reviews."
    );
  }

  return response.data ?? [];
}

/**
 * Create a new review
 */
export async function createReview(
  data: CreateReviewData
): Promise<Review> {
  const response = (await apiFetch(
    "/reviews",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  )) as ApiResponse<Review>;

  if (!response.success) {
    throw new Error(
      response.message ||
        "Unable to create review."
    );
  }

  return response.data;
}

/**
 * Update an existing review
 */
export async function updateReview(
  reviewId: number,
  data: UpdateReviewData
): Promise<Review> {
  const response = (await apiFetch(
    `/reviews/${reviewId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  )) as ApiResponse<Review>;

  if (!response.success) {
    throw new Error(
      response.message ||
        "Unable to update review."
    );
  }

  return response.data;
}

/**
 * Delete an existing review
 */
export async function deleteReview(
  reviewId: number
): Promise<{
  success: boolean;
  message: string;
}> {
  const response = (await apiFetch(
    `/reviews/${reviewId}`,
    {
      method: "DELETE",
    }
  )) as ApiResponse<{
    success: boolean;
    message: string;
  }>;

  if (!response.success) {
    throw new Error(
      response.message ||
        "Unable to delete review."
    );
  }

  return response.data;
}