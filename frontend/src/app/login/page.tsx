"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({
        login: loginValue,
        password,
      });

      router.push("/chats");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage("Не удалось войти. Проверь логин и пароль.");
      } else {
        setErrorMessage("Произошла неизвестная ошибка.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-bold text-white">
            AI
          </div>

          <h1 className="text-3xl font-semibold text-white">Вход</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Войди в активный аккаунт, чтобы работать с промптами и чатами.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
        >
          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-100">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Логин или email
              </label>
              <input
                value={loginValue}
                onChange={(event) => setLoginValue(event.target.value)}
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                placeholder="user или user@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Пароль
              </label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                placeholder="••••••••"
                type="password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
            >
              {isSubmitting ? "Входим..." : "Войти"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-400">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-emerald-400 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}