import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware";
import { projectRouter } from "./routes/project.routes";

const app = express();

app.use(express.json());
app.use("/projects", projectRouter);
app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
