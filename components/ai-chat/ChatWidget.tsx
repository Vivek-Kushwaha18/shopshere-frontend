
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import ChatWindow from "./ChatWindow";
import type { ChatMessageData } from "./ChatMessage";
import { sendAIMessage } from "@/services/ai";

export default function ChatWidget() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);

  const excludedRoutes = [
    "/admin",
    "/seller",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/privacy",
    "/terms",
  ];

  if (
    excludedRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`)
    )
  ) {
    return null;
  }

  async function handleSend(message: string) {
    if (loading) {
      return;
    }

    const userMessage: ChatMessageData = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setLoading(true);
    setError(null);

    try {
      const response = await sendAIMessage(message);

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.reply,
          products: response.products,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to contact the AI assistant. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <ChatWindow
          messages={messages}
          loading={loading}
          error={error}
          onSend={handleSend}
          onClose={() => setOpen(false)}
        />
      )}

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label={
          open
            ? "Close AI shopping assistant"
            : "Open AI shopping assistant"
        }
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105"
      >
        {open ? <X size={25} /> : <Bot size={27} />}
      </button>
    </>
  );
}
