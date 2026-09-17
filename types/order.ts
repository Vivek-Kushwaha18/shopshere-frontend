export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: number;
  user_id: number;
  address_id?: number;
  status: OrderStatus;
  total_amount: number;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
}