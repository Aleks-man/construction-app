import { forbidden } from "../errors/http-error";
import { projectUserRepository } from "../repositories/project-user.repository";
import type { ActivityActor } from "./activity.service";

export async function ensureActorCanManageProject(projectId: number, actor?: ActivityActor) {
  if (actor?.role !== "MANAGER") {
    return;
  }

  const managerMembership = await projectUserRepository.findByIds(projectId, actor.id);

  if (!managerMembership) {
    throw forbidden("Managers can manage only their assigned projects");
  }
}
