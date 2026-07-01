"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { PageContainer } from "@/components/page-container";
import { ApiError } from "@/lib/api";
import { registerUser } from "@/lib/auth-api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
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
        organization_name: organizationName || null,
        password,
      });

      setSuccessMessage(
        "Аккаунт создан. Теперь дождись подтверждения администратора.",
      );

      setFullName("");
      setUsername("");
      setEmail("");
      setOrganizationName("");
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
    <PageContainer>
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-12 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-2 text-2xl font-semibold">Регистрация</h1>

        <p className="mb-6 text-sm text-zinc-500">
          После регистрации аккаунт должен подтвердить администратор.
        </p>

        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="ФИО"
            required
          />

          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Username"
            required
          />

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Email"
            type="email"
            required
          />

          <input
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Организация"
          />

          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Пароль"
            type="password"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-zinc-950 px-4 py-3 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Создаём аккаунт..." : "Зарегистрироваться"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-zinc-950 underline">
            Войти
          </Link>
        </p>
      </form>
    </PageContainer>
  );
}