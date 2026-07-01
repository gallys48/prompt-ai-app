"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api";
import {
  approveUser,
  changeUserRole,
  changeUserStatus,
  deleteUserByAdmin,
  listAdminUsers,
} from "@/lib/admin-users-api";
import { useAuth } from "@/providers/auth-provider";
import type { User, UserRole, UserStatus } from "@/types/user";

const DEFAULT_LIMIT = 100;

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (
      typeof error.detail === "object" &&
      error.detail !== null &&
      "detail" in error.detail
    ) {
      const detail = error.detail.detail;

      if (typeof detail === "string") {
        return detail;
      }
    }

    return `Ошибка API: ${error.status}`;
  }

  return "Произошла неизвестная ошибка.";
}

function getStatusLabel(status: UserStatus): string {
  if (status === "pending") {
    return "Ожидает";
  }

  if (status === "active") {
    return "Активен";
  }

  if (status === "blocked") {
    return "Заблокирован";
  }

  if (status === "deleted") {
    return "Удалён";
  }

  return status;
}

function getRoleLabel(role: UserRole): string {
  if (role === "admin") {
    return "Админ";
  }

  if (role === "superuser") {
    return "Суперпользователь";
  }

  return "Пользователь";
}

function getStatusClasses(status: UserStatus): string {
  if (status === "active") {
    return "border-emerald-500/30 bg-emerald-950/40 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-500/30 bg-yellow-950/40 text-yellow-300";
  }

  if (status === "blocked") {
    return "border-red-500/30 bg-red-950/40 text-red-300";
  }

  return "border-neutral-700 bg-neutral-800 text-neutral-400";
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const query = search.trim().toLowerCase();

      if (!query) {
        return matchesStatus;
      }

      const matchesSearch =
        item.full_name.toLowerCase().includes(query) ||
        item.username.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.org.toLowerCase().includes(query) ||
        (item.post ?? "").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [users, search, statusFilter]);

  const pendingCount = useMemo(
    () => users.filter((item) => item.status === "pending").length,
    [users],
  );

  const activeCount = useMemo(
    () => users.filter((item) => item.status === "active").length,
    [users],
  );

  const blockedCount = useMemo(
    () => users.filter((item) => item.status === "blocked").length,
    [users],
  );

  const loadUsers = useCallback(async () => {
    setIsPageLoading(true);
    setErrorMessage(null);

    try {
      const data = await listAdminUsers({
        offset: 0,
        limit: DEFAULT_LIMIT,
      });

      setUsers(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user && !isAdmin) {
      router.push("/chats");
    }
  }, [isAuthLoading, isAuthenticated, isAdmin, router, user]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      void loadUsers();
    }
  }, [isAuthenticated, isAdmin, loadUsers]);

  async function updateUserInList(updatedUser: User) {
    setUsers((currentUsers) =>
      currentUsers.map((item) =>
        item.id === updatedUser.id ? updatedUser : item,
      ),
    );
  }

  async function handleApprove(targetUser: User) {
    setActionUserId(targetUser.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await approveUser(targetUser.id);

      await updateUserInList(updatedUser);
      setSuccessMessage(`Пользователь ${targetUser.username} подтверждён.`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setActionUserId(null);
    }
  }

  async function handleBlock(targetUser: User) {
    const isConfirmed = window.confirm(
      `Заблокировать пользователя ${targetUser.username}?`,
    );

    if (!isConfirmed) {
      return;
    }

    setActionUserId(targetUser.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await changeUserStatus(targetUser.id, {
        status: "blocked",
        is_active: false,
      });

      await updateUserInList(updatedUser);
      setSuccessMessage(`Пользователь ${targetUser.username} заблокирован.`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setActionUserId(null);
    }
  }

  async function handleUnblock(targetUser: User) {
    setActionUserId(targetUser.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await changeUserStatus(targetUser.id, {
        status: "active",
        is_active: true,
      });

      await updateUserInList(updatedUser);
      setSuccessMessage(`Пользователь ${targetUser.username} разблокирован.`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setActionUserId(null);
    }
  }

  async function handleRoleChange(targetUser: User, role: UserRole) {
    if (targetUser.role === role) {
      return;
    }

    setActionUserId(targetUser.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await changeUserRole(targetUser.id, {
        role,
      });

      await updateUserInList(updatedUser);
      setSuccessMessage(
        `Роль пользователя ${targetUser.username} изменена на ${getRoleLabel(role)}.`,
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setActionUserId(null);
    }
  }

  async function handleDelete(targetUser: User) {
    const isConfirmed = window.confirm(
      `Мягко удалить пользователя ${targetUser.username}?`,
    );

    if (!isConfirmed) {
      return;
    }

    setActionUserId(targetUser.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteUserByAdmin(targetUser.id);

      setUsers((currentUsers) =>
        currentUsers.filter((item) => item.id !== targetUser.id),
      );

      setSuccessMessage(`Пользователь ${targetUser.username} удалён.`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setActionUserId(null);
    }
  }

  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-neutral-950 text-neutral-400">
        Загрузка...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-neutral-950 text-neutral-400">
        Недостаточно прав.
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm text-emerald-400">Admin panel</p>
            <h1 className="text-3xl font-semibold text-white">
              Пользователи
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Подтверждение регистраций, блокировка аккаунтов и управление
              ролями.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={isPageLoading}
            className="rounded-2xl border border-neutral-700 px-5 py-3 text-sm text-neutral-300 transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPageLoading ? "Обновляем..." : "Обновить"}
          </button>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm text-neutral-500">Всего</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {users.length}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm text-neutral-500">Активные</div>
            <div className="mt-2 text-3xl font-semibold text-emerald-300">
              {activeCount}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm text-neutral-500">Ожидают</div>
            <div className="mt-2 text-3xl font-semibold text-yellow-300">
              {pendingCount}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm text-neutral-500">Заблокированы</div>
            <div className="mt-2 text-3xl font-semibold text-red-300">
              {blockedCount}
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100">
            {successMessage}
          </div>
        )}

        <section className="mb-6 flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-emerald-500"
            placeholder="Поиск по ФИО, username, email, организации..."
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as UserStatus | "all")
            }
            className="rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="active">Активен</option>
            <option value="blocked">Заблокирован</option>
          </select>
        </section>

        <section className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900">
          {isPageLoading ? (
            <div className="p-6 text-sm text-neutral-400">
              Загружаем пользователей...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-sm text-neutral-400">
              Пользователи не найдены.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead className="border-b border-neutral-800 bg-neutral-950/60 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Пользователь</th>
                    <th className="px-5 py-4 font-medium">Организация</th>
                    <th className="px-5 py-4 font-medium">Статус</th>
                    <th className="px-5 py-4 font-medium">Роль</th>
                    <th className="px-5 py-4 font-medium">Активность</th>
                    <th className="px-5 py-4 font-medium">Регистрация</th>
                    <th className="px-5 py-4 font-medium">Действия</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-800">
                  {filteredUsers.map((item) => {
                    const isCurrentUser = item.id === user.id;
                    const isActionLoading = actionUserId === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-neutral-800/50">
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">
                            {item.full_name}
                          </div>
                          <div className="mt-1 text-xs text-neutral-500">
                            @{item.username} · {item.email}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-neutral-200">{item.org}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {item.post || "Должность не указана"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs ${getStatusClasses(
                              item.status,
                            )}`}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={item.role}
                            onChange={(event) =>
                              void handleRoleChange(
                                item,
                                event.target.value as UserRole,
                              )
                            }
                            disabled={isActionLoading || isCurrentUser}
                            className="rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="user">Пользователь</option>
                            <option value="superuser">Суперпользователь</option>
                            <option value="admin">Админ</option>
                          </select>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              item.is_active
                                ? "text-emerald-300"
                                : "text-neutral-500"
                            }
                          >
                            {item.is_active ? "Активен" : "Неактивен"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-neutral-400">
                          {new Date(item.registered_at).toLocaleDateString(
                            "ru-RU",
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {item.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => void handleApprove(item)}
                                disabled={isActionLoading}
                                className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
                              >
                                Подтвердить
                              </button>
                            )}

                            {item.status === "blocked" ? (
                              <button
                                type="button"
                                onClick={() => void handleUnblock(item)}
                                disabled={isActionLoading}
                                className="rounded-xl border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300 transition hover:bg-emerald-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Разблокировать
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleBlock(item)}
                                disabled={isActionLoading || isCurrentUser}
                                className="rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Заблокировать
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => void handleDelete(item)}
                              disabled={isActionLoading || isCurrentUser}
                              className="rounded-xl border border-neutral-700 px-3 py-2 text-xs text-neutral-300 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}