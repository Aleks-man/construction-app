import { projectRepository } from "../repositories/project.repository";
import { badRequest, notFound } from "../errors/http-error";

export const projectService = {
  createProject(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw badRequest("name is required");
    }

    return projectRepository.create(trimmedName);
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

  async updateProject(id: number, name: string) {
    await this.getProject(id);

    const trimmedName = name.trim();

    if (!trimmedName) {
      throw badRequest("name is required");
    }

    return projectRepository.updateById(id, trimmedName);
  },

  async deleteProject(id: number) {
    await this.getProject(id);

    return projectRepository.deleteById(id);
  },
};
