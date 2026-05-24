import type { AuthUser } from "./auth";
import { apiRequest } from "./client";

export type TaskStatus = "NEW" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type ProjectTask = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: number | null;
  stageId: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectStage = {
  id: number;
  name: string;
  projectId: number;
  tasks: ProjectTask[];
};

export type ProjectMember = {
  userId: number;
  projectId: number;
  user: AuthUser & {
    createdAt: string;
  };
};

export type Project = {
  id: number;
  name: string;
  createdAt: string;
  users: ProjectMember[];
  stages: ProjectStage[];
};

export function getProjects() {
  return apiRequest<Project[]>("/projects");
}

export function getProjectById(projectId: number) {
  return apiRequest<Project>(`/projects/${projectId}`);
}

export function createProject(data: { name: string }) {
  return apiRequest<Project>("/projects", {
    method: "POST",
    body: data,
  });
}

export function deleteProject(projectId: number) {
  return apiRequest<Project>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}
