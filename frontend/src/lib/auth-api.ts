import { apiRequest } from "@/lib/api";
import type { LoginRequest, RegisterRequest, TokenPair } from "@/types/auth";
import type { User } from "@/types/user";

export async function loginUser(payload: LoginRequest): Promise<TokenPair> {
  return apiRequest<TokenPair>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function registerUser(payload: RegisterRequest): Promise<User> {
  return apiRequest<User>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/users/me", {
    method: "GET",
  });
}

export async function refreshSession(): Promise<TokenPair> {
  return apiRequest<TokenPair>("/auth/refresh", {
    method: "POST",
  });
}

export async function logoutUser(): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>("/auth/logout", {
    method: "POST",
  });
}