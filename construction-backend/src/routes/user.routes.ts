import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const userRouter = Router();

userRouter.use(authMiddleware);
userRouter.use(requireRole("ADMIN"));

userRouter.post("/", userController.create);
userRouter.get("/", userController.getAll);
userRouter.get("/:id", userController.getById);
userRouter.patch("/:id", userController.update);
userRouter.delete("/:id", userController.delete);
