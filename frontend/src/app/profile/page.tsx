"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api";
import { changePassword, updateCurrentUser } from "@/lib/profile-api";
import { useAuth } from "@/providers/auth-provider";

function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Произошла неизвестная ошибка.";
  }

  const detail = error.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (detail && typeof detail === "object" && "detail" in detail) {
    const nestedDetail = (detail as { detail?: unknown }).detail;

    if (typeof nestedDetail === "string") {
      return nestedDetail;
    }

    if (Array.isArray(nestedDetail)) {
      return "Проверь правильность заполнения полей.";
    }
  }

  if (error.status === 409) {
    return "Пользователь с таким email или username уже существует.";
  }

  if (error.status === 422) {
    return "Проверь правильность заполнения полей.";
  }

  return "Не удалось выполнить действие.";
}

function formatRole(role: string): string {
  const labels: Record<string, string> = {
    user: "Пользователь",
    superuser: "Суперпользователь",
    admin: "Администратор",
  };

  return labels[role] ?? role;
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: "Ожидает подтверждения",
    active: "Активен",
    blocked: "Заблокирован",
    deleted: "Удалён",
  };

  return labels[status] ?? status;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Неизвестно";
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, reloadUser, logout } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [post, setPost] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");

  const [profileSuccessMessage, setProfileSuccessMessage] = useState<
    string | null
  >(null);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(
    null,
  );

  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<
    string | null
  >(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<
    string | null
  >(null);

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    setFullName(user.full_name);
    setUsername(user.username);
    setEmail(user.email);
    setOrg(user.org);
    setPost(user.post ?? "");
    setImageUrl(user.image_url ?? "");
  }, [user]);

  function resetProfileForm() {
    if (!user) return;

    setFullName(user.full_name);
    setUsername(user.username);
    setEmail(user.email);
    setOrg(user.org);
    setPost(user.post ?? "");
    setImageUrl(user.image_url ?? "");

    setProfileSuccessMessage(null);
    setProfileErrorMessage(null);
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setProfileSuccessMessage(null);
    setProfileErrorMessage(null);

    const payload = {
      full_name: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      org: org.trim(),
      post: post.trim() || null,
      image_url: imageUrl.trim() || null,
    };

    if (!payload.full_name) {
      setProfileErrorMessage("ФИО не может быть пустым.");
      return;
    }

    if (!payload.username) {
      setProfileErrorMessage("Username не может быть пустым.");
      return;
    }

    if (!payload.email) {
      setProfileErrorMessage("Email не может быть пустым.");
      return;
    }

    if (!payload.org) {
      setProfileErrorMessage("Организация не может быть пустой.");
      return;
    }

    setIsSubmittingProfile(true);

    try {
      await updateCurrentUser(payload);
      await reloadUser();

      setProfileSuccessMessage("Данные профиля сохранены.");
    } catch (error) {
      setProfileErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPasswordSuccessMessage(null);
    setPasswordErrorMessage(null);

    if (newPassword !== newPasswordRepeat) {
      setPasswordErrorMessage("Новый пароль и повтор пароля не совпадают.");
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordErrorMessage("Новый пароль должен отличаться от текущего.");
      return;
    }

    setIsSubmittingPassword(true);

    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      setOldPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");

      setPasswordSuccessMessage(
        "Пароль изменён. Сейчас нужно войти заново с новым паролем.",
      );

      await logout().catch(() => undefined);
      router.replace("/login");
    } catch (error) {
      setPasswordErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmittingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-neutral-950 px-4 py-10 text-neutral-100">
        <div className="mx-auto max-w-6xl text-sm text-neutral-400">
          Загрузка профиля...
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <p className="mb-3 text-sm text-neutral-500">Аккаунт</p>
          <h1 className="text-3xl font-semibold text-white">Профиль</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Управляйте личными данными аккаунта и настройками безопасности.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Основные данные
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Эти данные используются в профиле и в административной части
                  приложения.
                </p>
              </div>

              <button
                type="button"
                onClick={resetProfileForm}
                className="rounded-2xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              >
                Сбросить изменения
              </button>
            </div>

            {profileSuccessMessage && (
              <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100">
                {profileSuccessMessage}
              </div>
            )}

            {profileErrorMessage && (
              <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-100">
                {profileErrorMessage}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-neutral-300">
                    ФИО
                  </label>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                    placeholder="ФИО"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-300">
                    Логин
                  </label>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                    placeholder="username"
                    minLength={3}
                    maxLength={20}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-300">
                    Email
                  </label>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                    placeholder="user@example.com"
                    type="email"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-300">
                    Организация
                  </label>
                  <input
                    value={org}
                    onChange={(event) => setOrg(event.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                    placeholder="Организация"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-300">
                    Должность
                  </label>
                  <input
                    value={post}
                    onChange={(event) => setPost(event.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                    placeholder="Должность"
                  />
                </div>

              </div>

              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
              >
                {isSubmittingProfile ? "Сохраняем..." : "Сохранить изменения"}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-5 text-xl font-semibold text-white">
                Статус аккаунта
              </h2>

              <div className="space-y-3">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    Роль
                  </div>
                  <div className="mt-2 text-sm text-neutral-100">
                    {formatRole(user.role)}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    Статус
                  </div>
                  <div className="mt-2 text-sm text-neutral-100">
                    {formatStatus(user.status)}
                  </div>
                </div>


                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    Дата регистрации
                  </div>
                  <div className="mt-2 text-sm text-neutral-100">
                    {formatDate(user.registered_at)}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    Обновлён
                  </div>
                  <div className="mt-2 text-sm text-neutral-100">
                    {formatDate(user.updated_at)}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-2 text-xl font-semibold text-white">
                Смена пароля
              </h2>

              <p className="mb-5 text-sm leading-6 text-neutral-400">
                После смены пароля текущая сессия будет завершена. Нужно будет
                войти заново.
              </p>

              {passwordSuccessMessage && (
                <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100">
                  {passwordSuccessMessage}
                </div>
              )}

              {passwordErrorMessage && (
                <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-100">
                  {passwordErrorMessage}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-neutral-300">
                    Текущий пароль
                  </label>
                  <input
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-300">
                    Новый пароль
                  </label>
                  <input
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                    placeholder="Минимум 8 символов"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-300">
                    Повтори новый пароль
                  </label>
                  <input
                    value={newPasswordRepeat}
                    onChange={(event) =>
                      setNewPasswordRepeat(event.target.value)
                    }
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
                    placeholder="Ещё раз новый пароль"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
                >
                  {isSubmittingPassword ? "Сохраняем..." : "Изменить пароль"}
                </button>
              </form>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
