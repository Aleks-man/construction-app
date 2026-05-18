import "../types/express";
import type { NextFunction, Request, Response } from "express";
import { forbidden, unauthorized } from "../errors/http-error";
import { authService } from "../services/auth.service";
import type { Role } from "../services/user.service";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      throw unauthorized("Authorization token is required");
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      throw unauthorized("Authorization token is required");
    }

    req.user = authService.verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw unauthorized("Authorization token is required");
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw forbidden("You do not have permission to perform this action");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
