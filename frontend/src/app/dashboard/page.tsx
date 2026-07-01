"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PageContainer } from "@/components/page-container";
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
      <PageContainer>
        <div className="py-10 text-zinc-500">Загрузка...</div>
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageContainer>
      <div className="py-10">
        <h1 className="mb-2 text-3xl font-semibold">Dashboard</h1>

        <p className="mb-2 text-zinc-500">
          Добро пожаловать, {user?.full_name}.
        </p>

        <p className="mb-8 text-sm text-zinc-400">
          Роль: {user?.role} · Статус: {user?.status}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/prompts"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:bg-zinc-50"
          >
            <h2 className="mb-2 text-xl font-semibold">Промпты</h2>
            <p className="text-sm text-zinc-500">
              Создание, редактирование и запуск промптов.
            </p>
          </Link>

          <Link
            href="/chats"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:bg-zinc-50"
          >
            <h2 className="mb-2 text-xl font-semibold">Чаты</h2>
            <p className="text-sm text-zinc-500">
              Диалоги с AI и история сообщений.
            </p>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}