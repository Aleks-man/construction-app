import { projectRepository } from "../repositories/project.repository";

export const projectService = {
  createProject(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error("Project name is required");
    }

    return projectRepository.create(trimmedName);
  },

  getProjects() {
    return projectRepository.findAll();
  },

  async deleteProject(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Project id must be a positive integer");
    }

    const project = await projectRepository.findById(id);

    if (!project) {
      throw new Error("Project not found");
    }

    return projectRepository.deleteById(id);
  },
};
