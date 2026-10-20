
"use client";

import { useEffect, useRef } from "react";
import { Bot, X } from "lucide-react";
import ChatInput from "./ChatInput";
import ChatMessage, { type ChatMessageData } from "./ChatMessage";

interface ChatWindowProps {
  messages: ChatMessageData[];
  loading: boolean;
  onSend: (message: string) => void;
  onClose: () => void;
  error: string | null;
}

export default function ChatWindow({
  messages,
  loading,
  onSend,
  onClose,
  error,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading, error]);

  return (
    <section
      aria-label="AI shopping assistant"
      className="fixed bottom-20 right-4 z-50 flex h-[min(620px,75vh)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
    >
      <header className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Bot size={25} />

          <div>
            <h2 className="font-semibold">
              ShopSphere AI
            </h2>
            <p className="text-xs opacity-90">
              AI Shopping Assistant
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="rounded-lg p-2 hover:bg-black/10"
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-xl bg-muted p-4 text-sm">
            <p className="font-semibold">
              Welcome to ShopSphere!
            </p>
            <p className="mt-2">
              Ask me to find products, compare prices,
              or help you choose something from our catalog.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
          />
        ))}

        {loading && (
          <p
            role="status"
            className="text-sm text-muted-foreground"
          >
            AI is thinking...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm"
          >
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={onSend}
        disabled={loading}
      />
    </section>
  );
}
