import { apiFetch } from "./api";

// =====================================================
// SHARED API ERROR HANDLING
// =====================================================

interface ApiErrorData {
  detail?: string | { msg?: string }[];
  message?: string;
}

function getApiErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const errorData = data as ApiErrorData;
  const detail = errorData.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => item.msg || "Invalid request")
      .join(", ");
  }

  if (
    typeof errorData.message === "string" &&
    errorData.message.trim()
  ) {
    return errorData.message;
  }

  return fallback;
}

// =====================================================
// STRIPE CARD PAYMENT
// =====================================================

export interface PaymentIntentCreateData {
  order_id: number;
  save_card?: boolean;
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
  const response = await apiFetch("/payments/create-intent", {
    method: "POST",
    body: JSON.stringify({
      order_id: data.order_id,
      save_card: data.save_card ?? false,
    }),
  });

  if (!response.success) {
    const message = getApiErrorMessage(
      response.data,
      "Unable to create Stripe payment."
    );

    console.error("Stripe payment creation failed:", {
      message,
      response: response.data,
    });

    throw new Error(message);
  }

  const result = response.data as PaymentIntentResponse;

  if (
    !result ||
    typeof result.client_secret !== "string" ||
    !result.client_secret ||
    typeof result.payment_id !== "number" ||
    typeof result.order_id !== "number"
  ) {
    console.error(
      "Stripe payment response is missing required fields:",
      response.data
    );

    throw new Error(
      "The server returned an invalid Stripe payment response."
    );
  }

  return result;
}

// =====================================================
// SAVED STRIPE CARDS
// =====================================================

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export interface SavedCardsResponse {
  cards: SavedCard[];
}

export async function getSavedCards(): Promise<SavedCard[]> {
  const response = await apiFetch("/payments/saved-cards", {
    method: "GET",
  });

  if (!response.success) {
    const message = getApiErrorMessage(
      response.data,
      "Unable to load saved cards."
    );

    console.error("Saved cards request failed:", {
      message,
      response: response.data,
    });

    throw new Error(message);
  }

  const result = response.data as SavedCardsResponse;

  return Array.isArray(result?.cards) ? result.cards : [];
}

// =====================================================
// STRIPE SAVED-CARD PAYMENT
// =====================================================

export interface SavedCardPaymentCreateData {
  order_id: number;
  payment_method_id: string;
}

export async function createSavedCardPaymentIntent(
  data: SavedCardPaymentCreateData
): Promise<PaymentIntentResponse> {
  const response = await apiFetch(
    "/payments/saved-cards/create-intent",
    {
      method: "POST",
      body: JSON.stringify({
        order_id: data.order_id,
        payment_method_id: data.payment_method_id,
      }),
    }
  );

  if (!response.success) {
    const message = getApiErrorMessage(
      response.data,
      "Unable to prepare payment with the saved card."
    );

    console.error("Saved-card payment creation failed:", {
      message,
      response: response.data,
    });

    throw new Error(message);
  }

  const result = response.data as PaymentIntentResponse;

  if (
    !result ||
    typeof result.client_secret !== "string" ||
    !result.client_secret ||
    typeof result.payment_id !== "number" ||
    typeof result.order_id !== "number"
  ) {
    console.error(
      "Saved-card payment response is missing required fields:",
      response.data
    );

    throw new Error(
      "The server returned an invalid saved-card payment response."
    );
  }

  return result;
}

// =====================================================
// RAZORPAY ORDER
// =====================================================

export interface RazorpayOrderCreateData {
  order_id: number;
}

export interface RazorpayOrderResponse {
  payment_id: number;
  order_id: number;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export async function createRazorpayOrder(
  data: RazorpayOrderCreateData
): Promise<RazorpayOrderResponse> {
  const response = await apiFetch(
    "/payments/razorpay/create-order",
    {
      method: "POST",
      body: JSON.stringify({
        order_id: data.order_id,
      }),
    }
  );

  if (!response.success) {
    const message = getApiErrorMessage(
      response.data,
      "Unable to create Razorpay order."
    );

    console.error("Razorpay order creation failed:", {
      message,
      response: response.data,
    });

    throw new Error(message);
  }

  const result = response.data as RazorpayOrderResponse;

  if (
    !result ||
    typeof result.payment_id !== "number" ||
    typeof result.order_id !== "number" ||
    typeof result.razorpay_order_id !== "string" ||
    typeof result.key_id !== "string"
  ) {
    console.error(
      "Razorpay order response is missing required fields:",
      response.data
    );

    throw new Error(
      "The server returned an invalid Razorpay order response."
    );
  }

  return result;
}

// =====================================================
// RAZORPAY PAYMENT VERIFICATION
// =====================================================

export interface RazorpayPaymentVerifyData {
  order_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentVerifyResponse {
  verified: boolean;
  order_id: number;
}

export async function verifyRazorpayPayment(
  data: RazorpayPaymentVerifyData
): Promise<RazorpayPaymentVerifyResponse> {
  const response = await apiFetch(
    "/payments/razorpay/verify",
    {
      method: "POST",
      body: JSON.stringify({
        order_id: data.order_id,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      }),
    }
  );

  if (!response.success) {
    const message = getApiErrorMessage(
      response.data,
      "Unable to verify Razorpay payment."
    );

    console.error("Razorpay payment verification failed:", {
      message,
      response: response.data,
    });

    throw new Error(message);
  }

  const result =
    response.data as RazorpayPaymentVerifyResponse;

  if (
    !result ||
    result.verified !== true ||
    typeof result.order_id !== "number"
  ) {
    console.error(
      "Razorpay verification response is invalid:",
      response.data
    );

    throw new Error(
      "The server could not confirm the Razorpay payment."
    );
  }

  return result;
}