import { Router } from "express";
import { projectUserController } from "../controllers/project-user.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const projectUserRouter = Router();

projectUserRouter.use(authMiddleware);

projectUserRouter.post("/", requireRole("ADMIN", "MANAGER"), projectUserController.create);
projectUserRouter.get("/", projectUserController.getAll);
projectUserRouter.delete(
  "/:projectId/:userId",
  requireRole("ADMIN", "MANAGER"),
  projectUserController.delete,
);
