"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api";
import { createChat } from "@/lib/chats-api";
import {
  createPrompt,
  deletePrompt,
  listPrompts,
  updatePrompt,
} from "@/lib/prompts-api";
import { useAuth } from "@/providers/auth-provider";
import type { Prompt } from "@/types/prompt";

const DEFAULT_LIMIT = 20;

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

export default function PromptsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [type, setType] = useState("SQL");
  const [shortDescription, setShortDescription] = useState("");
  const [text, setText] = useState("");

  const [editingPromptId, setEditingPromptId] = useState<number | null>(null);

  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionPromptId, setActionPromptId] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadPrompts = useCallback(async () => {
    setIsPageLoading(true);
    setErrorMessage(null);

    try {
      const data = await listPrompts({
        search: search || undefined,
        offset: 0,
        limit: DEFAULT_LIMIT,
      });

      setPrompts(data.items);
      setTotal(data.total);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsPageLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadPrompts();
    }
  }, [isAuthenticated, loadPrompts]);

  function resetForm() {
    setType("SQL");
    setShortDescription("");
    setText("");
    setEditingPromptId(null);
  }

  function canManagePrompt(prompt: Prompt): boolean {
    if (!user) {
        return false;
    }

    return user.role === "admin" || prompt.user_id === user.id;
    }

  function startEdit(prompt: Prompt) {
    setEditingPromptId(prompt.id);
    setType(prompt.type);
    setShortDescription(prompt.short_description);
    setText(prompt.text);
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (editingPromptId) {
        await updatePrompt(editingPromptId, {
          type,
          short_description: shortDescription,
          text,
        });

        setSuccessMessage("Промпт обновлён.");
      } else {
        await createPrompt({
          type,
          short_description: shortDescription,
          text,
        });

        setSuccessMessage("Промпт создан.");
      }

      resetForm();
      await loadPrompts();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(promptId: number) {
    const isConfirmed = window.confirm("Удалить этот промпт?");

    if (!isConfirmed) {
      return;
    }

    setActionPromptId(promptId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deletePrompt(promptId);

      setSuccessMessage("Промпт удалён.");
      await loadPrompts();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setActionPromptId(null);
    }
  }

  async function handleCreateChat(prompt: Prompt) {
    setActionPromptId(prompt.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const chat = await createChat({
        title: prompt.short_description,
      });

      sessionStorage.setItem(`prompt_ai_chat_draft_${chat.id}`, prompt.text);

      router.push(`/chats?chatId=${chat.id}`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setActionPromptId(null);
    }
  }

  if (isAuthLoading || !isAuthenticated) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-neutral-950 text-neutral-400">
        Загрузка...
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm text-emerald-400">Prompt library</p>
            <h1 className="text-3xl font-semibold text-white">Промпты</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Создавай шаблоны запросов и запускай их в чате с возможностью
              редактирования перед отправкой.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-400">
            Найдено: <span className="text-neutral-100">{total}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100">
            {successMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-5 text-xl font-semibold text-white">
              {editingPromptId ? "Редактировать промпт" : "Новый промпт"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                placeholder="Тип: SQL, GIS, Python..."
                required
              />

              <input
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                placeholder="Короткое описание"
                required
              />

              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="min-h-56 w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm leading-6 text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                placeholder="Текст промпта..."
                required
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
                >
                  {isSubmitting
                    ? "Сохраняем..."
                    : editingPromptId
                      ? "Сохранить"
                      : "Создать"}
                </button>

                {editingPromptId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-neutral-700 px-5 py-3 text-sm text-neutral-300 transition hover:bg-neutral-800"
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>
          </section>

          <section>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
              }}
              className="mb-4 flex gap-3"
            >
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                placeholder="Поиск по промптам"
              />

              <button
                type="submit"
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-400"
              >
                Найти
              </button>

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="rounded-2xl border border-neutral-700 px-5 py-3 text-sm text-neutral-300 transition hover:bg-neutral-900"
                >
                  Сброс
                </button>
              )}
            </form>

            {isPageLoading ? (
              <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
                Загружаем промпты...
              </div>
            ) : prompts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-neutral-700 bg-neutral-900 p-6 text-sm text-neutral-400">
                Промптов пока нет.
              </div>
            ) : (
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <article
                    key={prompt.id}
                    className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-neutral-700"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-300">
                                {prompt.type}
                            </span>

                            <span className="inline-flex rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs text-neutral-400">
                                Автор: @{prompt.creator_username ?? `user_${prompt.user_id}`}
                            </span>
                        </div>

                        <h2 className="text-xl font-semibold text-white">
                          {prompt.short_description}
                        </h2>
                      </div>

                      <div className="text-xs text-neutral-500">
                        #{prompt.id}
                      </div>
                    </div>

                    <p className="mb-5 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-neutral-400">
                      {prompt.text}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleCreateChat(prompt)}
                        disabled={actionPromptId === prompt.id}
                        className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
                        >
                        {actionPromptId === prompt.id ? "Открываем..." : "Создать чат"}
                        </button>

                        {canManagePrompt(prompt) && (
                        <>
                            <button
                            type="button"
                            onClick={() => startEdit(prompt)}
                            className="rounded-2xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
                            >
                            Редактировать
                            </button>

                            <button
                            type="button"
                            onClick={() => void handleDelete(prompt.id)}
                            disabled={actionPromptId === prompt.id}
                            className="rounded-2xl border border-red-500/30 px-4 py-2 text-sm text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                            Удалить
                            </button>
                        </>
                        )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}