import { Router } from "express";
import { projectController } from "../controllers/project.controller";

export const projectRouter = Router();

projectRouter.post("/", projectController.create);
projectRouter.get("/", projectController.getAll);
projectRouter.get("/:id", projectController.getById);
projectRouter.patch("/:id", projectController.update);
projectRouter.delete("/:id", projectController.delete);
