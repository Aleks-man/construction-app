import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.middleware";
import { authRouter } from "./routes/auth.routes";
import { projectRouter } from "./routes/project.routes";
import { projectUserRouter } from "./routes/project-user.routes";
import { stageRouter } from "./routes/stage.routes";
import { taskRouter } from "./routes/task.routes";
import { userRouter } from "./routes/user.routes";

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/projects", projectRouter);
app.use("/project-users", projectUserRouter);
app.use("/stages", stageRouter);
app.use("/tasks", taskRouter);
app.use("/users", userRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
