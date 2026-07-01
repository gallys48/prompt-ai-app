export type UserRole = "user" | "superuser" | "admin";

export type UserStatus = "pending" | "active" | "blocked" | "deleted";

export type User = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  image_url: string | null;
  org: string;
  post: string | null;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  registered_at: string;
  updated_at: string;
};