import { Router } from "express";
import { taskController } from "../controllers/task.controller";

export const taskRouter = Router();

taskRouter.post("/", taskController.create);
taskRouter.get("/", taskController.getAll);
taskRouter.get("/:id", taskController.getById);
taskRouter.patch("/:id", taskController.update);
taskRouter.delete("/:id", taskController.delete);
