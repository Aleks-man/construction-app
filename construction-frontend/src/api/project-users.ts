import { apiRequest } from "./client";
import type { ProjectMember } from "./projects";

export function addProjectUser(data: { projectId: number; userId: number }) {
  return apiRequest<ProjectMember>("/project-users", {
    method: "POST",
    body: data,
  });
}

export function removeProjectUser(projectId: number, userId: number) {
  return apiRequest<ProjectMember>(`/project-users/${projectId}/${userId}`, {
    method: "DELETE",
  });
}
