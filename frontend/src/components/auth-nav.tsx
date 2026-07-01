"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

export function AuthNav() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return <div className="text-sm text-zinc-500">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return (
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/login" className="text-zinc-700 hover:text-zinc-950">
          Войти
        </Link>

        <Link
          href="/register"
          className="rounded-lg bg-zinc-950 px-4 py-2 text-white hover:bg-zinc-800"
        >
          Регистрация
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/dashboard" className="text-zinc-700 hover:text-zinc-950">
        Dashboard
      </Link>

      <span className="text-zinc-500">{user?.username}</span>

      <button
        type="button"
        onClick={async () => {
            await logout();
            router.push("/");
        }}
        className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-100"
        >
        Выйти
    </button>
    </nav>
  );
}