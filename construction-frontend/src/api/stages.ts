import { apiRequest } from "./client";
import type { ProjectStage } from "./projects";

export function createStage(data: { name: string; projectId: number }) {
  return apiRequest<ProjectStage>("/stages", {
    method: "POST",
    body: data,
  });
}
