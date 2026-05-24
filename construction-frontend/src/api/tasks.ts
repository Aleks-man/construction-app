import { apiRequest } from "./client";
import type { ProjectTask, TaskPriority } from "./projects";

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
