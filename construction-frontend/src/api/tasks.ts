import { apiRequest } from "./client";
import type { AuthUser } from "./auth";
import type { ProjectTask, TaskPriority, TaskStatus } from "./projects";

export type TaskWithDetails = ProjectTask & {
  assignee: (AuthUser & { createdAt: string }) | null;
  stage: {
    id: number;
    name: string;
    projectId: number;
    project: {
      id: number;
      name: string;
    };
  };
};

export type TaskFilters = {
  assigneeId?: number;
  priority?: TaskPriority | "ALL";
  status?: TaskStatus | "ALL";
};

export function getTasks(filters: TaskFilters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.assigneeId) {
    searchParams.set("assigneeId", String(filters.assigneeId));
  }

  if (filters.priority && filters.priority !== "ALL") {
    searchParams.set("priority", filters.priority);
  }

  if (filters.status && filters.status !== "ALL") {
    searchParams.set("status", filters.status);
  }

  const query = searchParams.toString();

  return apiRequest<TaskWithDetails[]>(`/tasks${query ? `?${query}` : ""}`);
}

export function createTask(data: {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  stageId: number;
  assigneeId?: number | null;
}) {
  return apiRequest<ProjectTask>("/tasks", {
    method: "POST",
    body: data,
  });
}

export function updateTaskStatus(taskId: number, status: TaskStatus) {
  return apiRequest<ProjectTask>(`/tasks/${taskId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function updateTask(
  taskId: number,
  data: {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    dueDate?: string | null;
    assigneeId?: number | null;
  },
) {
  return apiRequest<ProjectTask>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: data,
  });
}

export function deleteTask(taskId: number) {
  return apiRequest<ProjectTask>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}
