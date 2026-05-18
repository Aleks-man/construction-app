import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const taskRouter = Router();

taskRouter.use(authMiddleware);

taskRouter.post("/", requireRole("ADMIN", "MANAGER"), taskController.create);
taskRouter.get("/", taskController.getAll);
taskRouter.get("/:id", taskController.getById);
taskRouter.patch("/:id", requireRole("ADMIN", "MANAGER"), taskController.update);
taskRouter.delete("/:id", requireRole("ADMIN", "MANAGER"), taskController.delete);
