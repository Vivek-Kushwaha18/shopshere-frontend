import { apiFetch } from "./api";

export interface PaymentIntentCreateData {
  order_id: number;
}

export interface PaymentIntentResponse {
  payment_id: number;
  order_id: number;
  amount: number;
  currency: string;
  client_secret: string;
}

export async function createPaymentIntent(
  data: PaymentIntentCreateData
): Promise<PaymentIntentResponse> {
  const response = await apiFetch(
    "/payments/create-intent",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to create payment."
    );
  }

  return response.data as PaymentIntentResponse;
}