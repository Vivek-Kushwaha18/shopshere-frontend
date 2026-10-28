
import { apiFetch } from "./api";

// =====================================================
// PAYMENT METHOD AND STATUS
// =====================================================

export type PaymentMethod = "stripe" | "razorpay" | "cod";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "partially_refunded"
  | "refund_failed"
  | string;

// =====================================================
// ORDER ITEM CREATE
// =====================================================

export interface OrderItemCreate {
  product_id: number;
  variant_id: number | null;
  quantity: number;
}

// =====================================================
// CREATE ORDER DATA
// =====================================================

export interface OrderCreateData {
  shipping_address: string;
  items: OrderItemCreate[];
  coupon_code?: string;
  payment_method?: PaymentMethod;
  idempotency_key?: string;
}

// =====================================================
// ORDER ITEM
// =====================================================

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  seller_id: number;
  seller_name: string | null;
  product_name: string;
  product_image: string | null;
  variant_sku?: string | null;
  variant_options?: {
    group_name: string;
    value: string;
  }[];
  quantity: number;
  price: number;
  total: number;
}

// =====================================================
// ORDER
// =====================================================

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  discount_amount: number;
  coupon_code: string | null;
  status: string;
  payment_status: PaymentStatus;
  shipping_address: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

// =====================================================
// SHIPMENT
// =====================================================

export interface Shipment {
  id: number;
  order_id: number;
  seller_id: number;
  tracking_number: string | null;
  status: string;
  expected_delivery_date: string | null;
  shipped_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// SHIPMENT STATUS UPDATE RESPONSE
// =====================================================

export interface ShipmentStatusUpdate {
  message: string;
  order_status: string;
  payment_status: PaymentStatus;
  shipment: Shipment;
}

// =====================================================
// CUSTOMER ORDER SHIPMENTS
// =====================================================

export interface CustomerOrderShipments {
  order_id: number;
  order_status: string;
  payment_status: PaymentStatus;
  shipments: Shipment[];
}

// =====================================================
// SELLER ANALYTICS
// =====================================================

export interface SellerTopProduct {
  product_id: number;
  product_name: string;
  units_sold: number;
  sales: number;
}

export interface SellerAnalytics {
  total_orders: number;
  total_units: number;
  total_sales: number;
  orders_by_status: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  top_products: SellerTopProduct[];
}

export interface SellerRevenue {
  date: string;
  orders: number;
  units: number;
  sales: number;
}

// =====================================================
// API ERROR HELPER
// =====================================================

function getErrorMessage(
  response: { data?: { detail?: unknown } },
  fallback: string,
): string {
  const detail = response.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  return fallback;
}

// =====================================================
// ORDER IDEMPOTENCY KEY
// =====================================================

/**
 * Generates a unique key for a new checkout attempt.
 *
 * Generate this once when a genuinely new checkout starts.
 * Reuse that same key when retrying the same checkout request.
 * Do not generate a new key for every network retry.
 */
export function createOrderIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
    Math.random().toString(36).slice(2),
  ].join("-");
}

// =====================================================
// CREATE ORDER - CUSTOMER
// =====================================================

export async function createOrder(
  data: OrderCreateData,
): Promise<Order> {
  const providedKey = data.idempotency_key?.trim();

  const idempotencyKey =
    providedKey || createOrderIdempotencyKey();

  const response = await apiFetch("/orders/", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      idempotency_key: idempotencyKey,
    }),
  });

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to create order."),
    );
  }

  return response.data as Order;
}

// =====================================================
// GET MY ORDERS - CUSTOMER
// =====================================================

export async function getMyOrders(): Promise<Order[]> {
  const response = await apiFetch("/orders/my-orders");

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to fetch orders."),
    );
  }

  return response.data as Order[];
}

// =====================================================
// CUSTOMER - CANCEL ORDER
// =====================================================

export async function cancelOrder(
  orderId: number,
): Promise<Order> {
  const response = await apiFetch(`/orders/${orderId}/cancel`, {
    method: "PATCH",
  });

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to cancel order."),
    );
  }

  return response.data as Order;
}

// =====================================================
// GET SINGLE ORDER
// =====================================================

export async function getOrder(orderId: number): Promise<Order> {
  const response = await apiFetch(`/orders/${orderId}`);

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to fetch order."),
    );
  }

  return response.data as Order;
}

// =====================================================
// SELLER - GET ANALYTICS
// =====================================================

export async function getSellerAnalytics(): Promise<SellerAnalytics> {
  const response = await apiFetch("/orders/seller/analytics");

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to fetch seller analytics."),
    );
  }

  return response.data as SellerAnalytics;
}

// =====================================================
// SELLER - GET REVENUE
// =====================================================

export async function getSellerRevenue(): Promise<SellerRevenue[]> {
  const response = await apiFetch("/orders/seller/revenue");

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to fetch seller revenue."),
    );
  }

  return response.data as SellerRevenue[];
}

// =====================================================
// SELLER - GET ORDERS
// =====================================================

export async function getSellerOrders(): Promise<Order[]> {
  const response = await apiFetch("/orders/seller/orders");

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to fetch seller orders."),
    );
  }

  return response.data as Order[];
}

// =====================================================
// SELLER - UPDATE ORDER STATUS
// =====================================================

export async function updateSellerOrderStatus(
  orderId: number,
  newStatus: string,
): Promise<Order> {
  const response = await apiFetch(
    `/orders/seller/${orderId}/status?new_status=${encodeURIComponent(newStatus)}`,
    { method: "PATCH" },
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to update order status."),
    );
  }

  return response.data as Order;
}

// =====================================================
// SELLER - GET MY SHIPMENTS
// =====================================================

export async function getSellerShipments(): Promise<Shipment[]> {
  const response = await apiFetch("/shipments/seller/my-shipments");

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to fetch shipments."),
    );
  }

  return response.data as Shipment[];
}

// =====================================================
// SELLER - CREATE DELIVERY SHIPMENT
// =====================================================

export async function createSellerShipment(
  orderId: number,
): Promise<Shipment> {
  const response = await apiFetch(
    `/shipments/seller/order/${orderId}`,
    { method: "POST" },
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to create delivery shipment."),
    );
  }

  return response.data.shipment as Shipment;
}

// =====================================================
// SELLER - UPDATE SHIPMENT STATUS AND ORDER STATUS
// =====================================================

export async function updateShipmentStatusWithOrder(
  shipmentId: number,
  newStatus: string,
): Promise<ShipmentStatusUpdate> {
  const response = await apiFetch(
    `/shipments/seller/${shipmentId}/status?new_status=${encodeURIComponent(newStatus)}`,
    { method: "PATCH" },
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to update shipment status."),
    );
  }

  return response.data as ShipmentStatusUpdate;
}

// =====================================================
// SELLER - UPDATE SHIPMENT STATUS
// =====================================================

export async function updateShipmentStatus(
  shipmentId: number,
  newStatus: string,
): Promise<Shipment> {
  const result = await updateShipmentStatusWithOrder(
    shipmentId,
    newStatus,
  );

  return result.shipment;
}

// =====================================================
// SELLER - UPDATE TRACKING NUMBER
// =====================================================

export async function updateShipmentTrackingNumber(
  shipmentId: number,
  trackingNumber: string,
): Promise<Shipment> {
  const response = await apiFetch(
    `/shipments/seller/${shipmentId}/tracking-number?tracking_number=${encodeURIComponent(trackingNumber)}`,
    { method: "PATCH" },
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to update tracking number."),
    );
  }

  return response.data.shipment as Shipment;
}

// =====================================================
// CUSTOMER - GET ORDER SHIPMENTS
// =====================================================

export async function getCustomerOrderShipments(
  orderId: number,
): Promise<CustomerOrderShipments> {
  const response = await apiFetch(
    `/shipments/customer/order/${orderId}`,
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(response, "Unable to fetch shipment details."),
    );
  }

  return response.data as CustomerOrderShipments;
}
