import type { Request, Response, NextFunction } from "express";
import { projectService } from "../services/project.service";

export const projectController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body as { name?: string };
      const project = await projectService.createProject(name ?? "");
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  },

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectService.getProjects();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Number(req.params.id);
      const deletedProject = await projectService.deleteProject(projectId);
      res.json(deletedProject);
    } catch (error) {
      next(error);
    }
  },
};
