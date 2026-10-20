
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  RefreshCw,
  Search,
  UserRound,
  MessageSquare,
  Clock,
  AlertCircle,
  Loader2,
  MessagesSquare,
} from "lucide-react";

import { apiFetch } from "@/services/api";

interface AIMessage {
  id: number;
  role: string;
  content: string;
  created_at: string;
}

interface AIConversation {
  id: number;
  user_id: number | null;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationDetails {
  conversation: AIConversation;
  messages: AIMessage[];
}

interface CustomerRoom {
  userId: number;
  conversations: AIConversation[];
  latestActivity: number;
}

interface RoomConversation extends ConversationDetails {}

function formatDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data &&
    typeof data.detail === "string"
  ) {
    return data.detail;
  }

  return fallback;
}

function getConversationDate(conversation: AIConversation): number {
  const date = new Date(
    conversation.updated_at || conversation.created_at
  ).getTime();

  return Number.isNaN(date) ? 0 : date;
}

export default function AdminAIConversationsPage() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [roomConversations, setRoomConversations] = useState<
    RoomConversation[]
  >([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomLoading, setRoomLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomError, setRoomError] = useState("");

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/admin/ai-conversations");

      if (!response.success) {
        throw new Error(
          getErrorMessage(
            response.data,
            "Unable to load AI conversations."
          )
        );
      }

      const result = response.data;
      const rawData: unknown = Array.isArray(result)
        ? result
        : result?.conversations;

      if (!Array.isArray(rawData)) {
        throw new Error(
          "The API response did not contain a conversations list."
        );
      }

      const list = (rawData as AIConversation[])
        .filter(
          (conversation) =>
            typeof conversation.id === "number"
        )
        .slice()
        .sort(
          (a, b) => getConversationDate(b) - getConversationDate(a)
        );

      setConversations(list);

      if (
        selectedCustomerId !== null &&
        !list.some(
          (conversation) => conversation.user_id === selectedCustomerId
        )
      ) {
        setSelectedCustomerId(null);
        setRoomConversations([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load AI conversations."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId]);

  const customerRooms = useMemo<CustomerRoom[]>(() => {
    const rooms = new Map<number, CustomerRoom>();

    for (const conversation of conversations) {
      if (conversation.user_id === null) continue;

      const userId = conversation.user_id;
      const activity = getConversationDate(conversation);
      const existing = rooms.get(userId);

      if (existing) {
        existing.conversations.push(conversation);
        existing.latestActivity = Math.max(
          existing.latestActivity,
          activity
        );
      } else {
        rooms.set(userId, {
          userId,
          conversations: [conversation],
          latestActivity: activity,
        });
      }
    }

    return Array.from(rooms.values())
      .map((room) => ({
        ...room,
        conversations: room.conversations
          .slice()
          .sort(
            (a, b) => getConversationDate(a) - getConversationDate(b)
          ),
      }))
      .sort((a, b) => b.latestActivity - a.latestActivity);
  }, [conversations]);

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customerRooms;

    return customerRooms.filter((room) => {
      const customerId = String(room.userId);
      const titles = room.conversations
        .map((conversation) => conversation.title || "")
        .join(" ");

      const conversationIds = room.conversations
        .map((conversation) => String(conversation.id))
        .join(" ");

      return (
        customerId.includes(query) ||
        titles.toLowerCase().includes(query) ||
        conversationIds.includes(query)
      );
    });
  }, [customerRooms, search]);

  const selectedRoom = useMemo(
    () =>
      customerRooms.find((room) => room.userId === selectedCustomerId) ??
      null,
    [customerRooms, selectedCustomerId]
  );

  const loadCustomerRoom = useCallback(
    async (customerId: number) => {
      setSelectedCustomerId(customerId);
      setRoomConversations([]);
      setRoomError("");
      setRoomLoading(true);

      try {
        const customerConversations = conversations
          .filter((conversation) => conversation.user_id === customerId)
          .slice()
          .sort(
            (a, b) => getConversationDate(a) - getConversationDate(b)
          );

        const results = await Promise.all(
          customerConversations.map(async (item) => {
            const response = await apiFetch(
              `/api/admin/ai-conversations/${item.id}`
            );

            if (!response.success) {
              throw new Error(
                getErrorMessage(
                  response.data,
                  `Unable to load conversation #${item.id}.`
                )
              );
            }

            const data = response.data;

            if (!data || typeof data !== "object") {
              throw new Error(
                `Invalid response for conversation #${item.id}.`
              );
            }

            const conversation = (
              data.conversation ?? data
            ) as AIConversation;

            const rawMessages: unknown = Array.isArray(data.messages)
              ? data.messages
              : Array.isArray(data.conversation?.messages)
                ? data.conversation.messages
                : [];

            if (
              !conversation ||
              conversation.id !== item.id ||
              !Array.isArray(rawMessages)
            ) {
              throw new Error(
                `Invalid conversation data for conversation #${item.id}.`
              );
            }

            if (conversation.user_id !== customerId) {
              throw new Error(
                `Conversation #${item.id} does not belong to customer #${customerId}.`
              );
            }

            const messages = (rawMessages as AIMessage[])
              .slice()
              .sort((a, b) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();

                return (
                  (Number.isNaN(dateA) ? 0 : dateA) -
                  (Number.isNaN(dateB) ? 0 : dateB)
                );
              });

            return { conversation, messages };
          })
        );

        setRoomConversations(results);
      } catch (err) {
        setRoomError(
          err instanceof Error
            ? err.message
            : "Unable to load this customer's conversation room."
        );
      } finally {
        setRoomLoading(false);
      }
    },
    [conversations]
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const totalMessages = useMemo(
    () =>
      roomConversations.reduce(
        (total, item) => total + item.messages.length,
        0
      ),
    [roomConversations]
  );

  const latestActivity = useMemo(() => {
    if (conversations.length === 0) return null;

    return conversations.reduce((latest, current) =>
      getConversationDate(current) > getConversationDate(latest)
        ? current
        : latest
    );
  }, [conversations]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/admin/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Back to Admin Dashboard
            </Link>

            <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
              <span className="rounded-xl bg-violet-100 p-3 text-violet-700">
                <MessagesSquare size={26} />
              </span>
              Customer AI Chat Rooms
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Search by customer ID and view all their AI conversations in one room.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadConversations()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Could not load conversations</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void loadConversations()}
                className="mt-3 rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium hover:bg-red-100"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total Conversations</p>
              <MessageSquare className="text-violet-600" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {loading ? "—" : conversations.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Customer Rooms</p>
              <UserRound className="text-blue-600" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {loading ? "—" : customerRooms.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Latest Activity</p>
              <Clock className="text-emerald-600" size={21} />
            </div>
            <p className="mt-3 text-sm font-semibold">
              {loading
                ? "Loading..."
                : latestActivity
                  ? formatDate(
                      latestActivity.updated_at ||
                        latestActivity.created_at
                    )
                  : "No activity yet"}
            </p>
          </div>
        </div>

        <div className="grid min-h-[650px] grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4">
              <h2 className="font-semibold">Customer Rooms</h2>
              <p className="mt-1 text-xs text-gray-500">
                {filteredRooms.length} customer
                {filteredRooms.length === 1 ? "" : "s"}
              </p>

              <div className="relative mt-4">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Enter customer ID..."
                  aria-label="Search customer rooms by customer ID"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>

            <div className="max-h-[700px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
                  <Loader2 size={18} className="animate-spin" />
                  Loading customer rooms...
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <UserRound
                    size={32}
                    className="mx-auto text-gray-300"
                  />
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    No customer rooms found
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Search for a customer ID with saved AI conversations.
                  </p>
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const isSelected = selectedCustomerId === room.userId;

                  return (
                    <button
                      key={room.userId}
                      type="button"
                      onClick={() => void loadCustomerRoom(room.userId)}
                      aria-pressed={isSelected}
                      className={`w-full border-b border-gray-100 p-4 text-left transition hover:bg-gray-50 ${
                        isSelected
                          ? "border-l-4 border-l-violet-600 bg-violet-50"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                          <UserRound size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            Customer #{room.userId}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {room.conversations.length} conversation
                            {room.conversations.length === 1 ? "" : "s"}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-xs text-violet-700">
                              Open room
                            </span>
                            <span className="text-right text-xs text-gray-400">
                              {formatDate(
                                room.conversations.at(-1)?.updated_at ||
                                  room.conversations.at(-1)?.created_at
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="flex min-h-[650px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {!selectedRoom ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-violet-100 p-5 text-violet-700">
                  <MessagesSquare size={34} />
                </div>
                <h2 className="mt-5 text-lg font-semibold">
                  Customer Chat Room
                </h2>
                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  Search for a customer and select their room to view all saved
                  AI conversations.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200 p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-xl font-bold">
                        Customer #{selectedRoom.userId}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        All saved AI conversations for this customer
                      </p>
                    </div>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
                      <Bot size={14} />
                      AI History Room
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Conversations</p>
                      <p className="mt-1 text-xl font-bold">
                        {selectedRoom.conversations.length}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Messages Loaded</p>
                      <p className="mt-1 text-xl font-bold">
                        {roomLoading ? "…" : totalMessages}
                      </p>
                    </div>
                  </div>
                </div>

                {roomError && (
                  <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-semibold">
                      Could not load the complete customer history
                    </p>
                    <p className="mt-1">{roomError}</p>
                    <button
                      type="button"
                      onClick={() => void loadCustomerRoom(selectedRoom.userId)}
                      className="mt-3 rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium hover:bg-red-100"
                    >
                      Try again
                    </button>
                  </div>
                )}

                <div className="flex-1 space-y-6 overflow-y-auto bg-gray-50/70 p-4 sm:p-6">
                  {roomLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                      <Loader2 size={20} className="animate-spin" />
                      Loading all customer conversations...
                    </div>
                  ) : roomConversations.length === 0 && !roomError ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                      No saved messages are available in this room.
                    </div>
                  ) : (
                    roomConversations.map((item) => (
                      <article
                        key={item.conversation.id}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                      >
                        <div className="border-b border-gray-200 bg-white p-4">
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                            <div>
                              <h3 className="font-semibold">
                                {item.conversation.title ||
                                  `Conversation #${item.conversation.id}`}
                              </h3>
                              <p className="mt-1 text-xs text-gray-500">
                                Conversation #{item.conversation.id}
                              </p>
                            </div>

                            <span className="text-xs text-gray-500">
                              {formatDate(item.conversation.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-5 p-4 sm:p-5">
                          {item.messages.length === 0 ? (
                            <p className="text-sm text-gray-500">
                              No messages in this conversation.
                            </p>
                          ) : (
                            item.messages.map((message) => {
                              const isUser =
                                message.role.toLowerCase() === "user";

                              return (
                                <div
                                  key={`${item.conversation.id}-${message.id}`}
                                  className={`flex gap-3 ${
                                    isUser ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  {!isUser && (
                                    <div className="mt-1 h-fit rounded-full bg-violet-100 p-2 text-violet-700">
                                      <Bot size={17} />
                                    </div>
                                  )}

                                  <div
                                    className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[80%] ${
                                      isUser
                                        ? "rounded-br-sm bg-violet-600 text-white"
                                        : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                                    }`}
                                  >
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                      <span
                                        className={`text-xs font-semibold ${
                                          isUser
                                            ? "text-violet-100"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {isUser ? "Customer" : "AI Assistant"}
                                      </span>
                                      <span
                                        className={`text-[10px] ${
                                          isUser
                                            ? "text-violet-100"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        {formatDate(message.created_at)}
                                      </span>
                                    </div>

                                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                      {message.content}
                                    </p>
                                  </div>

                                  {isUser && (
                                    <div className="mt-1 h-fit rounded-full bg-blue-100 p-2 text-blue-700">
                                      <UserRound size={17} />
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
