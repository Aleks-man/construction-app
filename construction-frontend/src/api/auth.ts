import { apiRequest } from "./client";

export type AuthUser = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: "ADMIN" | "MANAGER" | "WORKER";
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export function login(credentials: { email: string; password: string }) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function getCurrentUser() {
  return apiRequest<AuthUser>("/auth/me");
}
