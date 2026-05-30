import { conflict, forbidden, notFound } from "../errors/http-error";
import { projectRepository } from "../repositories/project.repository";
import { projectUserRepository } from "../repositories/project-user.repository";
import { userRepository } from "../repositories/user.repository";
import { activityService, type ActivityActor } from "./activity.service";

export const projectUserService = {
  getProjectUsers(projectId?: number) {
    return projectUserRepository.findAll(projectId);
  },

  async addUserToProject(projectId: number, userId: number, actor?: ActivityActor) {
    const user = await ensureProjectAndUserExist(projectId, userId);

    if (actor?.role === "MANAGER" && user.role !== "WORKER") {
      throw forbidden("Managers can add only worker users to projects");
    }

    const existing = await projectUserRepository.findByIds(projectId, userId);

    if (existing) {
      throw conflict("User is already added to this project");
    }

    const projectUser = await projectUserRepository.create({ projectId, userId });

    await activityService.record({
      action: "MEMBER_ADDED",
      entityType: "PROJECT_USER",
      entityId: userId,
      message: `added ${projectUser.user.email} to project`,
      projectId,
      actor,
    });

    return projectUser;
  },

  async removeUserFromProject(projectId: number, userId: number, actor?: ActivityActor) {
    const existing = await projectUserRepository.findByIds(projectId, userId);

    if (!existing) {
      throw notFound("Project user was not found");
    }

    const projectUser = await projectUserRepository.deleteByIds(projectId, userId);

    await activityService.record({
      action: "MEMBER_REMOVED",
      entityType: "PROJECT_USER",
      entityId: userId,
      message: `removed ${projectUser.user.email} from project`,
      projectId,
      actor,
    });

    return projectUser;
  },
};

async function ensureProjectAndUserExist(projectId: number, userId: number) {
  const [project, user] = await Promise.all([
    projectRepository.findById(projectId),
    userRepository.findById(userId),
  ]);

  if (!project) {
    throw notFound("Project not found");
  }

  if (!user) {
    throw notFound("User not found");
  }

  return user;
}
