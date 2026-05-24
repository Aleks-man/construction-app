import { apiRequest } from "./client";
import type { ProjectTask, TaskPriority, TaskStatus } from "./projects";

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
