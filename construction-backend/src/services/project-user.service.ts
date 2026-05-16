import { conflict, notFound } from "../errors/http-error";
import { projectRepository } from "../repositories/project.repository";
import { projectUserRepository } from "../repositories/project-user.repository";
import { userRepository } from "../repositories/user.repository";

export const projectUserService = {
  getProjectUsers(projectId?: number) {
    return projectUserRepository.findAll(projectId);
  },

  async addUserToProject(projectId: number, userId: number) {
    await ensureProjectAndUserExist(projectId, userId);

    const existing = await projectUserRepository.findByIds(projectId, userId);

    if (existing) {
      throw conflict("User is already added to this project");
    }

    return projectUserRepository.create({ projectId, userId });
  },

  async removeUserFromProject(projectId: number, userId: number) {
    const existing = await projectUserRepository.findByIds(projectId, userId);

    if (!existing) {
      throw notFound("Project user was not found");
    }

    return projectUserRepository.deleteByIds(projectId, userId);
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
}
