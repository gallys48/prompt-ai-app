"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/page-container";
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

      router.push("/dashboard");
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
    <PageContainer>
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-20 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-2 text-2xl font-semibold">Вход</h1>

        <p className="mb-6 text-sm text-zinc-500">
          Войди под активным аккаунтом. Pending-пользователь не сможет войти,
          пока его не подтвердит администратор.
        </p>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <input
            value={loginValue}
            onChange={(event) => setLoginValue(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Логин или email"
            required
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
            {isSubmitting ? "Входим..." : "Войти"}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}