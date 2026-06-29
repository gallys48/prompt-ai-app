export type UserRole = "user" | "superuser" | "admin";

export type UserStatus = "pending" | "active" | "blocked" | "deleted";

export type User = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  organization_name: string | null;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};