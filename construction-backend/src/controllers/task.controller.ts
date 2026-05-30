import "../types/express";
import type { NextFunction, Request, Response } from "express";
import { taskPriorities, taskService, taskStatuses } from "../services/task.service";
import {
  optionalDateTime,
  optionalEnum,
  optionalNullableDateTime,
  optionalNullableString,
  optionalString,
  parsePositiveInt,
  requireEnum,
  requireString,
} from "../utils/request";

export const taskController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.createTask({
        title: requireString(req.body.title, "title"),
        description: optionalNullableString(req.body.description, "description"),
        status: optionalEnum(req.body.status, taskStatuses, "status"),
        priority: optionalEnum(req.body.priority, taskPriorities, "priority"),
        dueDate: optionalNullableDateTime(req.body.dueDate, "dueDate"),
        stageId: parsePositiveInt(String(req.body.stageId), "stageId"),
        assigneeId: parseOptionalNullableId(req.body.assigneeId, "assigneeId"),
      }, req.user);

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
        priority:
          typeof req.query.priority === "string"
            ? optionalEnum(req.query.priority, taskPriorities, "priority")
            : undefined,
        dueBefore:
          typeof req.query.dueBefore === "string"
            ? optionalDateTime(req.query.dueBefore, "dueBefore")
            : undefined,
        dueAfter:
          typeof req.query.dueAfter === "string"
            ? optionalDateTime(req.query.dueAfter, "dueAfter")
            : undefined,
      }, req.user);

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
        description: optionalNullableString(req.body.description, "description"),
        status: optionalEnum(req.body.status, taskStatuses, "status"),
        priority: optionalEnum(req.body.priority, taskPriorities, "priority"),
        dueDate: optionalNullableDateTime(req.body.dueDate, "dueDate"),
        stageId:
          req.body.stageId === undefined
            ? undefined
            : parsePositiveInt(String(req.body.stageId), "stageId"),
        assigneeId: parseOptionalNullableId(req.body.assigneeId, "assigneeId"),
      }, req.user);

      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = parsePositiveInt(req.params.id, "taskId");
      const status = requireEnum(req.body.status, taskStatuses, "status");

      const task = await taskService.updateTaskStatus(taskId, status, req.user!);

      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = parsePositiveInt(req.params.id, "taskId");
      const task = await taskService.deleteTask(taskId, req.user);
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
