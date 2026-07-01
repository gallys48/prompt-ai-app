import { apiRequest } from "@/lib/api";
import type { User, UserRole, UserStatus } from "@/types/user";

type ListAdminUsersParams = {
  offset?: number;
  limit?: number;
};

export type ChangeUserRoleRequest = {
  role: UserRole;
};

export type ChangeUserStatusRequest = {
  status: UserStatus;
  is_active: boolean;
};

export async function listAdminUsers(
  params: ListAdminUsersParams = {},
): Promise<User[]> {
  const searchParams = new URLSearchParams();

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  const path = query ? `/admin/users?${query}` : "/admin/users";

  return apiRequest<User[]>(path);
}

export async function approveUser(userId: number): Promise<User> {
  return apiRequest<User>(`/admin/users/${userId}/approve`, {
    method: "PATCH",
  });
}

export async function changeUserRole(
  userId: number,
  payload: ChangeUserRoleRequest,
): Promise<User> {
  return apiRequest<User>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: payload,
  });
}

export async function changeUserStatus(
  userId: number,
  payload: ChangeUserStatusRequest,
): Promise<User> {
  return apiRequest<User>(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteUserByAdmin(userId: number): Promise<User> {
  return apiRequest<User>(`/admin/users/${userId}`, {
    method: "DELETE",
  });
}