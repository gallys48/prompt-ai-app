import type { User } from "@/types/user";

export type RegisterRequest = {
  full_name: string;
  username: string;
  email: string;
  password: string;
  org?: string | null;
  post?: string | null;
};

export type LoginRequest = {
  login: string;
  password: string;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type AuthResponse = {
  user: User;
  tokens: TokenPair;
};

export type MeResponse = User;