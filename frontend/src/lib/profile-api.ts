import { apiRequest } from "@/lib/api";
import type { User } from "@/types/user";

export type UpdateProfilePayload = {
  full_name?: string;
  username?: string;
  email?: string;
  org?: string;
  post?: string | null;
  image_url?: string | null;
};

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
};

export async function updateCurrentUser(
  payload: UpdateProfilePayload,
): Promise<User> {
  return apiRequest<User>("/users/me", {
    method: "PATCH",
    body: payload,
  });
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  await apiRequest<null>("/auth/change-password", {
    method: "POST",
    body: payload,
  });
}
