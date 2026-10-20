
import { apiFetch } from "./api";

export interface AIProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  image_url?: string | null;
  slug?: string | null;
}

export interface AIChatResponse {
  reply: string;
  products: AIProduct[];
}

export async function sendAIMessage(
  message: string
): Promise<AIChatResponse> {
  const result = await apiFetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      message: message.trim(),
    }),
  });

  if (!result.success) {
    throw new Error(
      result.data?.detail ||
        "Unable to contact the AI shopping assistant."
    );
  }

  return result.data as AIChatResponse;
}
