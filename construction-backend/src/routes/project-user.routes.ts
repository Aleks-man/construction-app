import { Router } from "express";
import { projectUserController } from "../controllers/project-user.controller";

export const projectUserRouter = Router();

projectUserRouter.post("/", projectUserController.create);
projectUserRouter.get("/", projectUserController.getAll);
projectUserRouter.delete(
  "/:projectId/:userId",
  projectUserController.delete,
);
