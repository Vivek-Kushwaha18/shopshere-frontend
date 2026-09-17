import { apiRequest } from "./api";

import type { Order } from "@/types/order";

type OrdersResponse =
  | Order[]
  | {
      status: number;
      success: boolean;
      data: Order[];
      message: string;
    };

type OrderResponse =
  | Order
  | {
      status: number;
      success: boolean;
      data: Order;
      message: string;
    };

export async function getOrders(): Promise<Order[]> {
  const response =
    await apiRequest<OrdersResponse>("/orders/");

  if (Array.isArray(response)) {
    return response;
  }

  return response.data || [];
}

export async function getOrder(
  orderId: number
): Promise<Order> {
  const response =
    await apiRequest<OrderResponse>(
      `/orders/${orderId}`
    );

  if ("id" in response) {
    return response;
  }

  return response.data;
}