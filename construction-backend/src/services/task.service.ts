import { badRequest, notFound } from "../errors/http-error";
import { stageRepository } from "../repositories/stage.repository";
import { taskRepository } from "../repositories/task.repository";
import { userRepository } from "../repositories/user.repository";

export const taskStatuses = ["NEW", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskService = {
  async createTask(data: {
    title: string;
    status?: TaskStatus;
    stageId: number;
    assigneeId?: number | null;
  }) {
    await ensureStageExists(data.stageId);
    await ensureAssigneeExists(data.assigneeId);

    return taskRepository.create({
      title: normalizeTitle(data.title),
      status: data.status,
      stageId: data.stageId,
      assigneeId: data.assigneeId,
    });
  },

  getTasks(filters: { stageId?: number; assigneeId?: number; status?: TaskStatus }) {
    return taskRepository.findAll(filters);
  },

  async getTask(id: number) {
    const task = await taskRepository.findById(id);

    if (!task) {
      throw notFound("Task not found");
    }

    return task;
  },

  async updateTask(
    id: number,
    data: Partial<{
      title: string;
      status: TaskStatus;
      stageId: number;
      assigneeId: number | null;
    }>,
  ) {
    await this.getTask(id);

    const updateData: Partial<{
      title: string;
      status: TaskStatus;
      stageId: number;
      assigneeId: number | null;
    }> = {};

    if (data.title !== undefined) {
      updateData.title = normalizeTitle(data.title);
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.stageId !== undefined) {
      await ensureStageExists(data.stageId);
      updateData.stageId = data.stageId;
    }

    if (data.assigneeId !== undefined) {
      await ensureAssigneeExists(data.assigneeId);
      updateData.assigneeId = data.assigneeId;
    }

    if (Object.keys(updateData).length === 0) {
      throw badRequest("At least one field is required");
    }

    return taskRepository.updateById(id, updateData);
  },

  async deleteTask(id: number) {
    await this.getTask(id);

    return taskRepository.deleteById(id);
  },
};

function normalizeTitle(title: string) {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw badRequest("title is required");
  }

  return trimmedTitle;
}

async function ensureStageExists(stageId: number) {
  const stage = await stageRepository.findById(stageId);

  if (!stage) {
    throw notFound("Stage not found");
  }
}

async function ensureAssigneeExists(assigneeId: number | null | undefined) {
  if (assigneeId === null || assigneeId === undefined) {
    return;
  }

  const assignee = await userRepository.findById(assigneeId);

  if (!assignee) {
    throw notFound("Assignee not found");
  }
}
