
import Link from "next/link";
import type { AIProduct } from "@/services/ai";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: AIProduct[];
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export default function ChatMessage({
  message,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {!isUser && message.products?.length ? (
          <div className="mt-3 space-y-2">
            {message.products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border bg-background p-3 text-foreground"
              >
                <p className="font-semibold">
                  {product.name}
                </p>

                <p className="mt-1 text-sm">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {product.stock > 0
                    ? "In stock"
                    : "Out of stock"}
                </p>

                <Link
                  href={`/products/${product.slug || product.id}`}
                  className="mt-2 inline-block text-sm font-medium text-primary underline"
                >
                  View product
                </Link>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
