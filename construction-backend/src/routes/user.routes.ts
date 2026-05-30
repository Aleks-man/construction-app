import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const userRouter = Router();

userRouter.use(authMiddleware);

userRouter.post("/", requireRole("ADMIN", "MANAGER"), userController.create);
userRouter.get("/", requireRole("ADMIN", "MANAGER"), userController.getAll);
userRouter.get("/:id", requireRole("ADMIN", "MANAGER"), userController.getById);
userRouter.patch("/:id", requireRole("ADMIN"), userController.update);
userRouter.delete("/:id", requireRole("ADMIN"), userController.delete);
