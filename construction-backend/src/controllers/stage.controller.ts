import type { NextFunction, Request, Response } from "express";
import { stageService } from "../services/stage.service";
import { optionalString, parsePositiveInt, requireString } from "../utils/request";

export const stageController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const stage = await stageService.createStage({
        name: requireString(req.body.name, "name"),
        projectId: parsePositiveInt(String(req.body.projectId), "projectId"),
      });

      res.status(201).json(stage);
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId =
        typeof req.query.projectId === "string"
          ? parsePositiveInt(req.query.projectId, "projectId")
          : undefined;
      const stages = await stageService.getStages(projectId);
      res.json(stages);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const stageId = parsePositiveInt(req.params.id, "stageId");
      const stage = await stageService.getStage(stageId);
      res.json(stage);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const stageId = parsePositiveInt(req.params.id, "stageId");
      const stage = await stageService.updateStage(stageId, {
        name: optionalString(req.body.name, "name"),
        projectId:
          req.body.projectId === undefined
            ? undefined
            : parsePositiveInt(String(req.body.projectId), "projectId"),
      });

      res.json(stage);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const stageId = parsePositiveInt(req.params.id, "stageId");
      const stage = await stageService.deleteStage(stageId);
      res.json(stage);
    } catch (error) {
      next(error);
    }
  },
};
