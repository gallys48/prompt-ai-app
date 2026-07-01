"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/providers/auth-provider";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-neutral-950 text-neutral-400">
        Загрузка...
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto w-full max-w-6xl">
        <section className="mb-8 rounded-3xl border border-neutral-800 bg-neutral-900 p-8">
          <p className="mb-3 text-sm text-emerald-400">Dashboard</p>

          <h1 className="text-3xl font-semibold text-white">
            Добро пожаловать, {user?.full_name}
          </h1>

          <p className="mt-3 text-sm text-neutral-400">
            Роль: {user?.role} · Статус: {user?.status}
          </p>

          {(user?.org || user?.post) && (
            <p className="mt-2 text-sm text-neutral-500">
              {user?.org}
              {user?.org && user?.post ? " · " : ""}
              {user?.post}
            </p>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/prompts"
            className="group rounded-3xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-emerald-500/50 hover:bg-neutral-800"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold text-white">
              P
            </div>

            <h2 className="mb-2 text-xl font-semibold text-white">
              Промпты
            </h2>

            <p className="text-sm leading-6 text-neutral-400">
              Создавай, редактируй и запускай промпты. При создании чата текст
              попадёт в поле ввода, чтобы его можно было изменить.
            </p>
          </Link>

          <Link
            href="/chats"
            className="group rounded-3xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-emerald-500/50 hover:bg-neutral-800"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold text-white">
              C
            </div>

            <h2 className="mb-2 text-xl font-semibold text-white">Чаты</h2>

            <p className="text-sm leading-6 text-neutral-400">
              Общайся с AI, отслеживай статус ответа и повторяй неудачные
              сообщения.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}