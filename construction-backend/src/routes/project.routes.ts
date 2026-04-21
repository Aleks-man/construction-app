import { Router } from "express";
import { projectController } from "../controllers/project.controller";

export const projectRouter = Router();

projectRouter.post("/", projectController.create);
projectRouter.get("/", projectController.getAll);
projectRouter.delete("/:id", projectController.delete);
