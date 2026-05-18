import { Router } from "express";
import { projectController } from "../controllers/project.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const projectRouter = Router();

projectRouter.use(authMiddleware);

projectRouter.post("/", requireRole("ADMIN", "MANAGER"), projectController.create);
projectRouter.get("/", projectController.getAll);
projectRouter.get("/:id", projectController.getById);
projectRouter.patch("/:id", requireRole("ADMIN", "MANAGER"), projectController.update);
projectRouter.delete("/:id", requireRole("ADMIN"), projectController.delete);
