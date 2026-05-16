import type { NextFunction, Request, Response } from "express";
import { userService, roles } from "../services/user.service";
import {
  optionalEnum,
  optionalString,
  parsePositiveInt,
  requireEnum,
  requireString,
} from "../utils/request";

export const userController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser({
        email: requireString(req.body.email, "email"),
        password: requireString(req.body.password, "password"),
        role: requireEnum(req.body.role, roles, "role"),
      });

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  },

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parsePositiveInt(req.params.id, "userId");
      const user = await userService.getUser(userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parsePositiveInt(req.params.id, "userId");
      const user = await userService.updateUser(userId, {
        email: optionalString(req.body.email, "email"),
        password: optionalString(req.body.password, "password"),
        role: optionalEnum(req.body.role, roles, "role"),
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parsePositiveInt(req.params.id, "userId");
      const user = await userService.deleteUser(userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },
};
