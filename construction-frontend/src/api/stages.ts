import { apiRequest } from "./client";
import type { ProjectStage } from "./projects";

export function createStage(data: { name: string; projectId: number }) {
  return apiRequest<ProjectStage>("/stages", {
    method: "POST",
    body: data,
  });
}

export function updateStage(stageId: number, data: { name: string }) {
  return apiRequest<ProjectStage>(`/stages/${stageId}`, {
    method: "PATCH",
    body: data,
  });
}

export function deleteStage(stageId: number) {
  return apiRequest<ProjectStage>(`/stages/${stageId}`, {
    method: "DELETE",
  });
}
