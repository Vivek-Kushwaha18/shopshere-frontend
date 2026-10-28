
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import ChatWindow from "./ChatWindow";
import type { ChatMessageData } from "./ChatMessage";
import { sendAIMessage } from "@/services/ai";

export default function ChatWidget() {
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("access_token");
      setIsLoggedIn(Boolean(token));

      if (!token) {
        setOpen(false);
      }
    };

    checkLoginStatus();

    window.addEventListener("storage", checkLoginStatus);

    return () => {
      window.removeEventListener("storage", checkLoginStatus);
    };
  }, [pathname]);

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
    !isLoggedIn ||
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

    setMessages((previous) => [...previous, userMessage]);
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
            ? "Close ShopSphere AI"
            : "Open ShopSphere AI shopping assistant"
        }
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-violet-600 via-indigo-700 to-blue-800 text-white shadow-[0_6px_24px_rgba(79,70,229,0.38)] transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_32px_rgba(79,70,229,0.5)] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/40 sm:bottom-7 sm:right-7 sm:h-16 sm:w-16 dark:border-slate-900"
      >
        {open ? (
          <X size={25} strokeWidth={2} />
        ) : (
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full p-2.5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="shopsphere-logo-gradient"
                x1="12"
                y1="10"
                x2="88"
                y2="90"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#E0E7FF" />
              </linearGradient>
            </defs>

            <path
              d="M72 24H37C23 24 17 33 17 43C17 54 25 60 39 60H58C65 60 68 63 68 68C68 73 64 76 57 76H26L17 88H61C77 88 84 79 84 68C84 56 76 49 61 49H40C34 49 31 47 31 43C31 39 34 36 40 36H64L72 24Z"
              fill="url(#shopsphere-logo-gradient)"
            />

            <path
              d="M78 19L81 26L88 29L81 32L78 39L75 32L68 29L75 26L78 19Z"
              fill="#C4B5FD"
            />

            <path
              d="M88 42L90 47L95 49L90 51L88 56L86 51L81 49L86 47L88 42Z"
              fill="#A5F3FC"
            />
          </svg>
        )}

        {!open && (
          <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-900" />
        )}
      </button>
    </>
  );
}
