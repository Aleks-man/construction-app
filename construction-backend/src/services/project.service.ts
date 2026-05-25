import { projectRepository } from "../repositories/project.repository";
import { badRequest, conflict, notFound } from "../errors/http-error";
import { activityService, type ActivityActor } from "./activity.service";

export const projectService = {
  async createProject(name: string, actor?: ActivityActor) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw badRequest("name is required");
    }

    await ensureProjectNameIsAvailable(trimmedName);

    const project = await projectRepository.create(trimmedName);

    await activityService.record({
      action: "PROJECT_CREATED",
      entityType: "PROJECT",
      entityId: project.id,
      message: `created project "${project.name}"`,
      projectId: project.id,
      actor,
    });

    return project;
  },

  getProjects() {
    return projectRepository.findAll();
  },

  async getProject(id: number) {
    const project = await projectRepository.findById(id);

    if (!project) {
      throw notFound("Project not found");
    }

    return project;
  },

  async updateProject(id: number, name: string, actor?: ActivityActor) {
    const existingProject = await this.getProject(id);

    const trimmedName = name.trim();

    if (!trimmedName) {
      throw badRequest("name is required");
    }

    await ensureProjectNameIsAvailable(trimmedName, id);

    const project = await projectRepository.updateById(id, trimmedName);

    await activityService.record({
      action: "PROJECT_UPDATED",
      entityType: "PROJECT",
      entityId: project.id,
      message: `renamed project from "${existingProject.name}" to "${project.name}"`,
      projectId: project.id,
      actor,
    });

    return project;
  },

  async deleteProject(id: number, actor?: ActivityActor) {
    const project = await this.getProject(id);

    await activityService.record({
      action: "PROJECT_DELETED",
      entityType: "PROJECT",
      entityId: project.id,
      message: `deleted project "${project.name}"`,
      projectId: project.id,
      actor,
    });

    return projectRepository.deleteById(id);
  },
};

async function ensureProjectNameIsAvailable(name: string, currentProjectId?: number) {
  const existingProject = await projectRepository.findByName(name, currentProjectId);

  if (existingProject) {
    throw conflict("Project with this name already exists");
  }
}
