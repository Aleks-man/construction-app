import { Router } from "express";
import { stageController } from "../controllers/stage.controller";

export const stageRouter = Router();

stageRouter.post("/", stageController.create);
stageRouter.get("/", stageController.getAll);
stageRouter.get("/:id", stageController.getById);
stageRouter.patch("/:id", stageController.update);
stageRouter.delete("/:id", stageController.delete);
