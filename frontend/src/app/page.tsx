"use client";

import Link from "next/link";

import { useAuth } from "@/providers/auth-provider";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-2xl font-bold text-white shadow-lg shadow-emerald-500/20">
          AI
        </div>

        <p className="mb-4 rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-400">
          Единое пространство для работы с AI-запросами
        </p>

        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
          Создавайте промпты, запускайте диалоги и получайте ответы быстрее
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-400 md:text-lg">
          Сохраняйте полезные запросы, редактируйте их перед отправкой и
          возвращайтесь к истории диалогов в удобном интерфейсе.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {isLoading ? (
            <div className="rounded-2xl border border-neutral-800 px-6 py-3 text-sm text-neutral-400">
              Загрузка...
            </div>
          ) : isAuthenticated ? (
            <>
              <Link
                href="/chats"
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-400"
              >
                Открыть чаты
              </Link>

              <Link
                href="/prompts"
                className="rounded-2xl border border-neutral-700 px-6 py-3 text-sm font-medium text-neutral-100 transition hover:bg-neutral-900"
              >
                Перейти к промптам
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-400"
              >
                Войти
              </Link>

              <Link
                href="/register"
                className="rounded-2xl border border-neutral-700 px-6 py-3 text-sm font-medium text-neutral-100 transition hover:bg-neutral-900"
              >
                Создать аккаунт
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid w-full gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-left">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-800 text-lg">
              ✦
            </div>

            <h2 className="mb-2 text-lg font-semibold text-white">
              Библиотека промптов
            </h2>

            <p className="text-sm leading-6 text-neutral-400">
              Храните готовые запросы для рабочих задач и запускайте их в чат
              в один клик.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-left">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-800 text-lg">
              ↗
            </div>

            <h2 className="mb-2 text-lg font-semibold text-white">
              Редактирование перед отправкой
            </h2>

            <p className="text-sm leading-6 text-neutral-400">
              Промпт вставляется в поле ввода, чтобы вы могли уточнить запрос
              перед отправкой.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-left">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-800 text-lg">
              ●
            </div>

            <h2 className="mb-2 text-lg font-semibold text-white">
              История диалогов
            </h2>

            <p className="text-sm leading-6 text-neutral-400">
              Возвращайтесь к прошлым чатам, продолжайте обсуждения и управляйте
              сохранёнными диалогами.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}