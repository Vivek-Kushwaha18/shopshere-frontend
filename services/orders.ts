import { apiFetch } from "./api";

// =====================================================
// ORDER ITEM CREATE
// =====================================================

export interface OrderItemCreate {
  product_id: number;
  quantity: number;
}

// =====================================================
// CREATE ORDER DATA
// =====================================================

export interface OrderCreateData {
  shipping_address: string;
  items: OrderItemCreate[];
  coupon_code?: string;
}

// =====================================================
// ORDER ITEM
// =====================================================

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  seller_id: number;

  product_name: string;
  product_image: string | null;

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
  payment_status: string;

  shipping_address: string;

  created_at: string;
  updated_at: string;

  items: OrderItem[];
}

// =====================================================
// SELLER TOP PRODUCT
// =====================================================

export interface SellerTopProduct {
  product_id: number;
  product_name: string;
  units_sold: number;
  sales: number;
}

// =====================================================
// SELLER ANALYTICS
// =====================================================

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

// =====================================================
// SELLER REVENUE
// =====================================================

export interface SellerRevenue {
  date: string;
  orders: number;
  units: number;
  sales: number;
}

// =====================================================
// CREATE ORDER - CUSTOMER
// =====================================================

export async function createOrder(
  data: OrderCreateData
): Promise<Order> {
  const response = await apiFetch(
    "/orders/",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to create order."
    );
  }

  return response.data as Order;
}

// =====================================================
// GET MY ORDERS - CUSTOMER
// =====================================================

export async function getMyOrders(): Promise<Order[]> {
  const response = await apiFetch(
    "/orders/my-orders"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch orders."
    );
  }

  return response.data as Order[];
}

// =====================================================
// GET SINGLE ORDER
// =====================================================

export async function getOrder(
  orderId: number
): Promise<Order> {
  const response = await apiFetch(
    `/orders/${orderId}`
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch order."
    );
  }

  return response.data as Order;
}

// =====================================================
// SELLER - GET ANALYTICS
// =====================================================

export async function getSellerAnalytics(): Promise<SellerAnalytics> {
  const response = await apiFetch(
    "/orders/seller/analytics"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch seller analytics."
    );
  }

  return response.data as SellerAnalytics;
}

// =====================================================
// SELLER - GET REVENUE
// =====================================================

export async function getSellerRevenue(): Promise<SellerRevenue[]> {
  const response = await apiFetch(
    "/orders/seller/revenue"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch seller revenue."
    );
  }

  return response.data as SellerRevenue[];
}

// =====================================================
// SELLER - GET ORDERS
// =====================================================

export async function getSellerOrders(): Promise<Order[]> {
  const response = await apiFetch(
    "/orders/seller/orders"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch seller orders."
    );
  }

  return response.data as Order[];
}

// =====================================================
// SELLER - UPDATE ORDER STATUS
// =====================================================

export async function updateSellerOrderStatus(
  orderId: number,
  newStatus: string
): Promise<Order> {
  const response = await apiFetch(
    `/orders/seller/${orderId}/status?new_status=${encodeURIComponent(
      newStatus
    )}`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update order status."
    );
  }

  return response.data as Order;
}