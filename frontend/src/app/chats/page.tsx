"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api";
import {
  createChat,
  deleteChat,
  getChatMessage,
  listChatMessages,
  listChats,
  retryChatMessage,
  sendChatMessage,
} from "@/lib/chats-api";
import { useAuth } from "@/providers/auth-provider";
import type { Chat, ChatMessage } from "@/types/chat";

const DEFAULT_LIMIT = 50;

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (
      typeof error.detail === "object" &&
      error.detail !== null &&
      "detail" in error.detail
    ) {
      const detail = error.detail.detail;

      if (typeof detail === "string") {
        return detail;
      }
    }

    return `Ошибка API: ${error.status}`;
  }

  return "Произошла неизвестная ошибка.";
}

function getMessageStatusText(message: ChatMessage): string {
  if (message.status === "pending") {
    return "Ожидает обработки...";
  }

  if (message.status === "processing") {
    return "Генерируется ответ...";
  }

  if (message.status === "failed") {
    return message.error_message || "Ошибка генерации ответа.";
  }

  return message.text || "";
}

export default function ChatsPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatIdFromUrl, setChatIdFromUrl] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [newChatTitle, setNewChatTitle] = useState("");
  const [messageText, setMessageText] = useState("");

  const [isChatsLoading, setIsChatsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [actionMessageId, setActionMessageId] = useState<number | null>(null);
  const [actionChatId, setActionChatId] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId],
  );

  function selectChat(chatId: number) {
    setSelectedChatId(chatId);
    router.push(`/chats?chatId=${chatId}`);
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const rawChatId = searchParams.get("chatId");

    if (!rawChatId) {
      setChatIdFromUrl(null);
      return;
    }

    const parsedChatId = Number(rawChatId);

    if (Number.isNaN(parsedChatId)) {
      setChatIdFromUrl(null);
      return;
    }

    setChatIdFromUrl(parsedChatId);
  }, []);

  const loadChats = useCallback(async () => {
    setIsChatsLoading(true);
    setErrorMessage(null);

    try {
      const data = await listChats({
        offset: 0,
        limit: DEFAULT_LIMIT,
      });

      setChats(data.items);

      if (
        chatIdFromUrl &&
        data.items.some((chat) => chat.id === chatIdFromUrl)
      ) {
        setSelectedChatId(chatIdFromUrl);
        return;
      }

      if (!selectedChatId && data.items.length > 0) {
        setSelectedChatId(data.items[0].id);
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsChatsLoading(false);
    }
  }, [chatIdFromUrl, selectedChatId]);

  const loadMessages = useCallback(async (chatId: number) => {
    setIsMessagesLoading(true);
    setErrorMessage(null);

    try {
      const data = await listChatMessages(chatId);
      setMessages(data.items);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadChats();
    }
  }, [isAuthenticated, loadChats]);

  useEffect(() => {
    if (selectedChatId) {
      void loadMessages(selectedChatId);
    } else {
      setMessages([]);
    }
  }, [selectedChatId, loadMessages]);

  useEffect(() => {
    if (!selectedChatId) {
      return;
    }

    const draftKey = `prompt_ai_chat_draft_${selectedChatId}`;
    const draftText = sessionStorage.getItem(draftKey);

    if (!draftText) {
      return;
    }

    setMessageText(draftText);
    sessionStorage.removeItem(draftKey);
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    if (!selectedChatId) {
      return;
    }

    const hasPendingAssistantMessage = messages.some(
      (message) =>
        message.sender_type === "assistant" &&
        (message.status === "pending" || message.status === "processing"),
    );

    if (!hasPendingAssistantMessage) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void Promise.all(
        messages
          .filter(
            (message) =>
              message.sender_type === "assistant" &&
              (message.status === "pending" ||
                message.status === "processing"),
          )
          .map(async (message) => {
            const updatedMessage = await getChatMessage(
              selectedChatId,
              message.id,
            );

            setMessages((currentMessages) =>
              currentMessages.map((currentMessage) =>
                currentMessage.id === updatedMessage.id
                  ? updatedMessage
                  : currentMessage,
              ),
            );
          }),
      ).catch((error) => {
        setErrorMessage(getApiErrorMessage(error));
      });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedChatId, messages]);

  async function handleCreateChat(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const title = newChatTitle.trim() || "Новый чат";

    setIsCreatingChat(true);
    setErrorMessage(null);

    try {
      const chat = await createChat({
        title,
      });

      setChats((currentChats) => [chat, ...currentChats]);
      setSelectedChatId(chat.id);
      setNewChatTitle("");
      setMessages([]);
      router.push(`/chats?chatId=${chat.id}`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsCreatingChat(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedChatId) {
      await handleCreateChat();
      return;
    }

    const text = messageText.trim();

    if (!text) {
      return;
    }

    setIsSendingMessage(true);
    setErrorMessage(null);

    try {
      const data = await sendChatMessage(selectedChatId, {
        text,
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        data.user_message,
        data.assistant_message,
      ]);

      setMessageText("");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleRetry(message: ChatMessage) {
    if (!selectedChatId) {
      return;
    }

    setActionMessageId(message.id);
    setErrorMessage(null);

    try {
      const updatedMessage = await retryChatMessage(selectedChatId, message.id);

      setMessages((currentMessages) =>
        currentMessages.map((currentMessage) =>
          currentMessage.id === updatedMessage.id
            ? updatedMessage
            : currentMessage,
        ),
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setActionMessageId(null);
    }
  }

  async function handleDeleteChat(chatId: number) {
    const isConfirmed = window.confirm("Удалить этот чат?");

    if (!isConfirmed) {
      return;
    }

    setActionChatId(chatId);
    setErrorMessage(null);

    try {
      await deleteChat(chatId);

      setChats((currentChats) =>
        currentChats.filter((chat) => chat.id !== chatId),
      );

      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
        router.push("/chats");
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setActionChatId(null);
    }
  }

  if (isAuthLoading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-300">
        Загрузка...
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100vh-64px)] bg-neutral-950 text-neutral-100">
      <aside className="flex w-72 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
        <div className="border-b border-neutral-800 p-3">
          <button
            type="button"
            onClick={() => void handleCreateChat()}
            disabled={isCreatingChat}
            className="flex w-full items-center justify-center rounded-xl border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-100 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingChat ? "Создаём..." : "+ Новый чат"}
          </button>
        </div>

        <form onSubmit={handleCreateChat} className="border-b border-neutral-800 p-3">
          <input
            value={newChatTitle}
            onChange={(event) => setNewChatTitle(event.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-emerald-500"
            placeholder="Название чата"
          />
        </form>

        <div className="flex-1 overflow-y-auto p-2">
          {isChatsLoading ? (
            <div className="px-3 py-2 text-sm text-neutral-500">
              Загружаем чаты...
            </div>
          ) : chats.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-500">
              Чатов пока нет.
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2 transition ${
                    selectedChatId === chat.id
                      ? "bg-neutral-800"
                      : "hover:bg-neutral-900"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectChat(chat.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm text-neutral-100">
                      {chat.title}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDeleteChat(chat.id)}
                    disabled={actionChatId === chat.id}
                    className="opacity-0 text-xs text-neutral-500 transition hover:text-red-300 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Удалить чат"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-neutral-900">
        <header className="flex h-14 items-center justify-between border-b border-neutral-800 px-6">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-medium text-neutral-100">
              {selectedChat ? selectedChat.title : "Prompt AI Chat"}
            </h1>
            <p className="text-xs text-neutral-500">
              {selectedChat ? `Чат #${selectedChat.id}` : "Выбери чат или начни новый"}
            </p>
          </div>
        </header>

        {errorMessage && (
          <div className="mx-auto mt-4 w-full max-w-3xl rounded-xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-8">
            {!selectedChat && messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-2xl font-semibold text-white">
                  AI
                </div>

                <h2 className="mb-2 text-3xl font-semibold text-neutral-100">
                  Чем займёмся?
                </h2>

                <p className="max-w-xl text-sm leading-6 text-neutral-400">
                  Создай новый чат, выбери существующий слева или вставь промпт
                  из раздела промптов. Перед отправкой текст можно отредактировать.
                </p>
              </div>
            ) : isMessagesLoading ? (
              <div className="text-sm text-neutral-500">
                Загружаем сообщения...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <h2 className="mb-2 text-2xl font-semibold text-neutral-100">
                  Новый диалог
                </h2>

                <p className="max-w-lg text-sm leading-6 text-neutral-400">
                  Напиши первое сообщение. Если ты пришёл сюда из промптов,
                  текст промпта уже должен быть в поле ввода.
                </p>
              </div>
            ) : (
              <div className="space-y-7">
                {messages.map((message) => {
                  const isUser = message.sender_type === "user";

                  return (
                    <article
                      key={message.id}
                      className={`flex gap-4 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
                          AI
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          isUser
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-800 text-neutral-100"
                        }`}
                      >
                        <div className="mb-1 text-xs opacity-60">
                          {isUser ? "Вы" : "Assistant"} · {message.status}
                        </div>

                        <div className="whitespace-pre-wrap">
                          {getMessageStatusText(message)}
                        </div>

                        {message.sender_type === "assistant" &&
                          message.status === "failed" && (
                            <button
                              type="button"
                              onClick={() => void handleRetry(message)}
                              disabled={actionMessageId === message.id}
                              className="mt-3 rounded-lg border border-red-400/40 bg-red-950/40 px-3 py-2 text-xs text-red-100 hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionMessageId === message.id
                                ? "Повторяем..."
                                : "Повторить"}
                            </button>
                          )}
                      </div>

                      {isUser && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold text-white">
                          Вы
                        </div>
                      )}
                    </article>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-neutral-800 bg-neutral-900 px-4 py-4">
          <form
            onSubmit={handleSendMessage}
            className="mx-auto flex w-full max-w-3xl items-end gap-3 rounded-2xl border border-neutral-700 bg-neutral-800 p-3 shadow-xl"
          >
            <textarea
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              className="max-h-52 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-neutral-100 placeholder:text-neutral-500 outline-none"
              placeholder="Спроси что-нибудь..."
              rows={1}
            />

            <button
              type="submit"
              disabled={isSendingMessage || !messageText.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
              title="Отправить"
            >
              {isSendingMessage ? "…" : "↑"}
            </button>
          </form>

          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-neutral-600">
            Enter — отправить, Shift + Enter — новая строка.
          </p>
        </footer>
      </section>
    </main>
  );
}