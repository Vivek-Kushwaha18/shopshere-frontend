import { apiFetch } from "./api";

// =====================================================
// PAYMENT METHOD
// =====================================================

export type PaymentMethod =
  | "stripe"
  | "cod";

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
  payment_method?: PaymentMethod;
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
// CUSTOMER ORDER SHIPMENTS
// =====================================================

export interface CustomerOrderShipments {
  order_id: number;
  order_status: string;
  payment_status: string;
  shipments: Shipment[];
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
// CUSTOMER - CANCEL ORDER
// =====================================================

export async function cancelOrder(
  orderId: number
): Promise<Order> {
  const response = await apiFetch(
    `/orders/${orderId}/cancel`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to cancel order."
    );
  }

  return response.data as Order;
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

// =====================================================
// SELLER - GET MY SHIPMENTS
// =====================================================

export async function getSellerShipments(): Promise<Shipment[]> {
  const response = await apiFetch(
    "/shipments/seller/my-shipments"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch shipments."
    );
  }

  return response.data as Shipment[];
}

// =====================================================
// SELLER - UPDATE SHIPMENT STATUS
// =====================================================

export async function updateShipmentStatus(
  shipmentId: number,
  newStatus: string
): Promise<Shipment> {
  const response = await apiFetch(
    `/shipments/seller/${shipmentId}/status?new_status=${encodeURIComponent(
      newStatus
    )}`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update shipment status."
    );
  }

  return response.data as Shipment;
}

// =====================================================
// SELLER - UPDATE TRACKING NUMBER
// =====================================================

export async function updateShipmentTrackingNumber(
  shipmentId: number,
  trackingNumber: string
): Promise<Shipment> {
  const response = await apiFetch(
    `/shipments/seller/${shipmentId}/tracking-number?tracking_number=${encodeURIComponent(
      trackingNumber
    )}`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update tracking number."
    );
  }

  return response.data as Shipment;
}

// =====================================================
// CUSTOMER - GET ORDER SHIPMENTS
// =====================================================

export async function getCustomerOrderShipments(
  orderId: number
): Promise<CustomerOrderShipments> {
  const response = await apiFetch(
    `/shipments/customer/order/${orderId}`
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch shipment details."
    );
  }

  return response.data as CustomerOrderShipments;
}