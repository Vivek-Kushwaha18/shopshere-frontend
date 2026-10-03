import { apiFetch } from "./api";

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
  status: string;
  payment_status: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

// =====================================================
// CREATE ORDER ITEM
// =====================================================

export interface OrderItemCreate {
  product_id: number;
  quantity: number;
}

// =====================================================
// CREATE ORDER
// =====================================================

export interface OrderCreateData {
  shipping_address: string;
  items: OrderItemCreate[];
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

  top_products: {
    product_id: number;
    product_name: string;
    units_sold: number;
    sales: number;
  }[];
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
// GET CUSTOMER ORDERS
// =====================================================

export async function getMyOrders(): Promise<Order[]> {
  const response = await apiFetch(
    "/orders/my-orders"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch your orders."
    );
  }

  if (!Array.isArray(response.data)) {
    throw new Error(
      "Invalid orders response."
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
// GET SELLER ORDERS
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

  if (!Array.isArray(response.data)) {
    throw new Error(
      "Invalid seller orders response."
    );
  }

  return response.data as Order[];
}

// =====================================================
// UPDATE SELLER ORDER STATUS
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

// =====================================================
// GET SELLER ANALYTICS
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