import { Router } from "express";
import { stageController } from "../controllers/stage.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const stageRouter = Router();

stageRouter.use(authMiddleware);

stageRouter.post("/", requireRole("ADMIN", "MANAGER"), stageController.create);
stageRouter.get("/", stageController.getAll);
stageRouter.get("/:id", stageController.getById);
stageRouter.patch("/:id", requireRole("ADMIN", "MANAGER"), stageController.update);
stageRouter.delete("/:id", requireRole("ADMIN", "MANAGER"), stageController.delete);
