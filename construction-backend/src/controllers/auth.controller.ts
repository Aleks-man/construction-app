import "../types/express";
import type { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service";
import { requireString } from "../utils/request";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const authResult = await authService.login({
        email: requireString(req.body.email, "email"),
        password: requireString(req.body.password, "password"),
      });

      res.json(authResult);
    } catch (error) {
      next(error);
    }
  },

  me(req: Request, res: Response) {
    res.json(req.user);
  },
};
