import { apiFetch } from "./api";

// =====================================================
// COUPON
// =====================================================

export interface Coupon {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount: number | null;
  start_date: string;
  expiry_date: string;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// ADMIN COUPON PAYLOAD
// =====================================================

export interface CouponPayload {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount: number | null;
  start_date: string;
  expiry_date: string;
  usage_limit: number | null;
  is_active: boolean;
}

// =====================================================
// CUSTOMER COUPON VALIDATION
// =====================================================

export interface CouponValidationResponse {
  valid: boolean;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  discount_amount: number;
  subtotal: number;
  final_amount: number;
}

// =====================================================
// GET COUPONS - ADMIN
// =====================================================

export async function getCoupons(): Promise<Coupon[]> {
  const response = await apiFetch(
    "/admin/coupons/"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch coupons."
    );
  }

  const coupons = response.data?.data;

  if (!Array.isArray(coupons)) {
    throw new Error(
      "Invalid coupons response."
    );
  }

  return coupons as Coupon[];
}

// =====================================================
// CREATE COUPON - ADMIN
// =====================================================

export async function createCoupon(
  data: CouponPayload
): Promise<Coupon> {
  const response = await apiFetch(
    "/admin/coupons/",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to create coupon."
    );
  }

  return response.data?.data as Coupon;
}

// =====================================================
// UPDATE COUPON - ADMIN
// =====================================================

export async function updateCoupon(
  couponId: number,
  data: CouponPayload
): Promise<Coupon> {
  const response = await apiFetch(
    `/admin/coupons/${couponId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update coupon."
    );
  }

  return response.data?.data as Coupon;
}

// =====================================================
// UPDATE COUPON STATUS - ADMIN
// =====================================================

export async function updateCouponStatus(
  couponId: number,
  isActive: boolean
): Promise<Coupon> {
  const response = await apiFetch(
    `/admin/coupons/${couponId}/status?is_active=${isActive}`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update coupon status."
    );
  }

  return response.data?.data as Coupon;
}

// =====================================================
// DELETE COUPON - ADMIN
// =====================================================

export async function deleteCoupon(
  couponId: number
): Promise<void> {
  const response = await apiFetch(
    `/admin/coupons/${couponId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to delete coupon."
    );
  }
}

// =====================================================
// VALIDATE COUPON - CUSTOMER
// =====================================================

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidationResponse> {
  const response = await apiFetch(
    "/coupons/validate",
    {
      method: "POST",
      body: JSON.stringify({
        code,
        subtotal,
      }),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to validate coupon."
    );
  }

  return response.data as CouponValidationResponse;
}