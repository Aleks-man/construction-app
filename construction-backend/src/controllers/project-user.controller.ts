import type { NextFunction, Request, Response } from "express";
import { projectUserService } from "../services/project-user.service";
import { parsePositiveInt } from "../utils/request";

export const projectUserController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId =
        typeof req.query.projectId === "string"
          ? parsePositiveInt(req.query.projectId, "projectId")
          : undefined;
      const projectUsers = await projectUserService.getProjectUsers(projectId);
      res.json(projectUsers);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const projectUser = await projectUserService.addUserToProject(
        parsePositiveInt(String(req.body.projectId), "projectId"),
        parsePositiveInt(String(req.body.userId), "userId"),
        req.user,
      );

      res.status(201).json(projectUser);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const projectUser = await projectUserService.removeUserFromProject(
        parsePositiveInt(req.params.projectId, "projectId"),
        parsePositiveInt(req.params.userId, "userId"),
        req.user,
      );

      res.json(projectUser);
    } catch (error) {
      next(error);
    }
  },
};
