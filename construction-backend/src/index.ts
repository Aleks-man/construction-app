import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware";
import { projectRouter } from "./routes/project.routes";
import { projectUserRouter } from "./routes/project-user.routes";
import { stageRouter } from "./routes/stage.routes";
import { taskRouter } from "./routes/task.routes";
import { userRouter } from "./routes/user.routes";

const app = express();

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

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
