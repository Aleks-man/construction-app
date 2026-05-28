import { apiRequest } from "./client";

export type UserRole = "ADMIN" | "MANAGER" | "WORKER";

export type AppUser = {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
};

export function getUsers() {
  return apiRequest<AppUser[]>("/users");
}

export function createUser(data: { email: string; password: string; role: UserRole }) {
  return apiRequest<AppUser>("/users", {
    method: "POST",
    body: data,
  });
}

export function deleteUser(userId: number) {
  return apiRequest<AppUser>(`/users/${userId}`, {
    method: "DELETE",
  });
}
