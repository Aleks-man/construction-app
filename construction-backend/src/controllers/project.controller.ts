import type { Request, Response, NextFunction } from "express";
import { projectService } from "../services/project.service";
import { activityService } from "../services/activity.service";
import { parsePositiveInt, requireString } from "../utils/request";

export const projectController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const name = requireString(req.body.name, "name");
      const project = await projectService.createProject(name, req.user);
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

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parsePositiveInt(req.params.id, "projectId");
      const project = await projectService.getProject(projectId);
      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parsePositiveInt(req.params.id, "projectId");
      const name = requireString(req.body.name, "name");
      const project = await projectService.updateProject(projectId, name, req.user);
      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parsePositiveInt(req.params.id, "projectId");
      const deletedProject = await projectService.deleteProject(projectId, req.user);
      res.json(deletedProject);
    } catch (error) {
      next(error);
    }
  },

  async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parsePositiveInt(req.params.id, "projectId");
      const activity = await activityService.getProjectActivity(projectId);
      res.json(activity);
    } catch (error) {
      next(error);
    }
  },
};
