import { Router } from "express";
import { userController } from "../controllers/user.controller";

export const userRouter = Router();

userRouter.post("/", userController.create);
userRouter.get("/", userController.getAll);
userRouter.get("/:id", userController.getById);
userRouter.patch("/:id", userController.update);
userRouter.delete("/:id", userController.delete);
