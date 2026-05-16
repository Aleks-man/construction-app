import type { NextFunction, Request, Response } from "express";
import { taskService, taskStatuses } from "../services/task.service";
import {
  optionalEnum,
  optionalString,
  parsePositiveInt,
  requireString,
} from "../utils/request";

export const taskController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.createTask({
        title: requireString(req.body.title, "title"),
        status: optionalEnum(req.body.status, taskStatuses, "status"),
        stageId: parsePositiveInt(String(req.body.stageId), "stageId"),
        assigneeId: parseOptionalNullableId(req.body.assigneeId, "assigneeId"),
      });

      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await taskService.getTasks({
        stageId:
          typeof req.query.stageId === "string"
            ? parsePositiveInt(req.query.stageId, "stageId")
            : undefined,
        assigneeId:
          typeof req.query.assigneeId === "string"
            ? parsePositiveInt(req.query.assigneeId, "assigneeId")
            : undefined,
        status:
          typeof req.query.status === "string"
            ? optionalEnum(req.query.status, taskStatuses, "status")
            : undefined,
      });

      res.json(tasks);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = parsePositiveInt(req.params.id, "taskId");
      const task = await taskService.getTask(taskId);
      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = parsePositiveInt(req.params.id, "taskId");
      const task = await taskService.updateTask(taskId, {
        title: optionalString(req.body.title, "title"),
        status: optionalEnum(req.body.status, taskStatuses, "status"),
        stageId:
          req.body.stageId === undefined
            ? undefined
            : parsePositiveInt(String(req.body.stageId), "stageId"),
        assigneeId: parseOptionalNullableId(req.body.assigneeId, "assigneeId"),
      });

      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = parsePositiveInt(req.params.id, "taskId");
      const task = await taskService.deleteTask(taskId);
      res.json(task);
    } catch (error) {
      next(error);
    }
  },
};

function parseOptionalNullableId(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return parsePositiveInt(String(value), fieldName);
}
