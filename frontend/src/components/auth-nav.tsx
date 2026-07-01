"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

export function AuthNav() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return <div className="text-sm text-neutral-500">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return (
      <nav className="flex items-center gap-3 text-sm">
        <Link
          href="/login"
          className="rounded-xl px-3 py-2 text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
        >
          Войти
        </Link>

        <Link
          href="/register"
          className="rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white transition hover:bg-emerald-400"
        >
          Регистрация
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2 text-sm">

      <Link
        href="/prompts"
        className="rounded-xl px-3 py-2 text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
      >
        Промпты
      </Link>

      <Link
        href="/chats"
        className="rounded-xl px-3 py-2 text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
      >
        Чаты
      </Link>

      {user?.role === "admin" && (
        <Link
          href="/admin/users"
          className="rounded-xl px-3 py-2 text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
        >
          Админка
        </Link>
      )}

      <div className="hidden rounded-xl border border-neutral-800 px-3 py-2 text-neutral-400 md:block">
        {user?.username}
      </div>

      <button
        type="button"
        onClick={async () => {
          await logout();
          router.push("/");
        }}
        className="rounded-xl border border-neutral-700 px-3 py-2 text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
      >
        Выйти
      </button>
    </nav>
  );
}