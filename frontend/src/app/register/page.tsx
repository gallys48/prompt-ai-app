"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { ApiError } from "@/lib/api";
import { registerUser } from "@/lib/auth-api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [post, setPost] = useState("");
  const [password, setPassword] = useState("");

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await registerUser({
        full_name: fullName,
        username,
        email,
        org: org || null,
        post: post || null,
        password,
      });

      setSuccessMessage(
        "Аккаунт создан. Теперь дождись подтверждения администратора.",
      );

      setFullName("");
      setUsername("");
      setEmail("");
      setOrg("");
      setPost("");
      setPassword("");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage("Не удалось зарегистрироваться. Проверь данные.");
      } else {
        setErrorMessage("Произошла неизвестная ошибка.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-bold text-white">
            AI
          </div>

          <h1 className="text-3xl font-semibold text-white">Регистрация</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Создай аккаунт. После регистрации администратор должен активировать
            пользователя.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
        >
          {successMessage && (
            <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-100">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
              placeholder="ФИО"
              required
            />

            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
              placeholder="Username"
              required
            />

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
              placeholder="Email"
              type="email"
              required
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={org}
                onChange={(event) => setOrg(event.target.value)}
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                placeholder="Организация"
              />

              <input
                value={post}
                onChange={(event) => setPost(event.target.value)}
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                placeholder="Должность"
              />
            </div>

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
              placeholder="Пароль"
              type="password"
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
            >
              {isSubmitting ? "Создаём аккаунт..." : "Зарегистрироваться"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-400">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}