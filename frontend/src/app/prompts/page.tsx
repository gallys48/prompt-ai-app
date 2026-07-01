"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/page-container";
import { ApiError } from "@/lib/api";
import { createChatFromPrompt } from "@/lib/chats-api";
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
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();

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
        const chat = await createChatFromPrompt(prompt.id, {
        title: prompt.short_description,
        });

        setSuccessMessage(
        `Чат создан: #${chat.id}. Полный интерфейс чатов сделаем на этапе 21.`,
        );
    } catch (error) {
        setErrorMessage(getApiErrorMessage(error));
    } finally {
        setActionPromptId(null);
    }
    }

  if (isAuthLoading || !isAuthenticated) {
    return (
      <PageContainer>
        <div className="py-10 text-zinc-500">Загрузка...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="py-10">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Промпты</h1>
          <p className="text-zinc-500">
            Создавай, ищи, редактируй и запускай промпты.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">
              {editingPromptId ? "Редактировать промпт" : "Новый промпт"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Тип
                </label>
                <input
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
                  placeholder="SQL, GIS, Python..."
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Короткое описание
                </label>
                <input
                  value={shortDescription}
                  onChange={(event) =>
                    setShortDescription(event.target.value)
                  }
                  className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
                  placeholder="Например: Проверка дублей"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Текст промпта
                </label>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="min-h-48 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
                  placeholder="Напиши текст промпта..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-zinc-950 px-5 py-3 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="rounded-lg border border-zinc-300 px-5 py-3 hover:bg-zinc-100"
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
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-zinc-950"
                placeholder="Поиск по промптам"
              />

              <button
                type="submit"
                className="rounded-lg bg-zinc-950 px-5 py-3 text-white hover:bg-zinc-800"
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
                  className="rounded-lg border border-zinc-300 px-5 py-3 hover:bg-zinc-100"
                >
                  Сброс
                </button>
              )}
            </form>

            <div className="mb-3 text-sm text-zinc-500">
              Найдено: {total}
            </div>

            {isPageLoading ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-500">
                Загружаем промпты...
              </div>
            ) : prompts.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-500">
                Промптов пока нет.
              </div>
            ) : (
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <article
                    key={prompt.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                          {prompt.type}
                        </div>

                        <h2 className="text-xl font-semibold">
                          {prompt.short_description}
                        </h2>
                      </div>

                      <div className="text-xs text-zinc-400">
                        #{prompt.id}
                      </div>
                    </div>

                    <p className="mb-5 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                      {prompt.text}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(prompt)}
                        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
                      >
                        Редактировать
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleCreateChat(prompt)}
                        disabled={actionPromptId === prompt.id}
                        className="rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionPromptId === prompt.id
                          ? "Запускаем..."
                          : "Создать чат"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(prompt.id)}
                        disabled={actionPromptId === prompt.id}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageContainer>
  );
}