import { badRequest, notFound } from "../errors/http-error";
import { projectUserRepository } from "../repositories/project-user.repository";
import { stageRepository } from "../repositories/stage.repository";
import { taskRepository } from "../repositories/task.repository";
import { userRepository } from "../repositories/user.repository";

export const taskStatuses = ["NEW", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskPriorities = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

export const taskService = {
  async createTask(data: {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
    stageId: number;
    assigneeId?: number | null;
  }) {
    await ensureAssigneeCanBeAssigned(data.stageId, data.assigneeId);

    return taskRepository.create({
      title: normalizeTitle(data.title),
      description: normalizeOptionalText(data.description),
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      stageId: data.stageId,
      assigneeId: data.assigneeId,
    });
  },

  getTasks(filters: {
    stageId?: number;
    assigneeId?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueBefore?: Date;
    dueAfter?: Date;
  }) {
    if (filters.dueBefore && filters.dueAfter && filters.dueAfter > filters.dueBefore) {
      throw badRequest("dueAfter must be before dueBefore");
    }

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
      description: string | null;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: Date | null;
      stageId: number;
      assigneeId: number | null;
    }>,
  ) {
    const existingTask = await this.getTask(id);

    const updateData: Partial<{
      title: string;
      description: string | null;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: Date | null;
      stageId: number;
      assigneeId: number | null;
    }> = {};

    if (data.title !== undefined) {
      updateData.title = normalizeTitle(data.title);
    }

    if (data.description !== undefined) {
      updateData.description = normalizeOptionalText(data.description);
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
    }

    if (data.stageId !== undefined) {
      updateData.stageId = data.stageId;
    }

    if (data.assigneeId !== undefined) {
      updateData.assigneeId = data.assigneeId;
    }

    if (data.stageId !== undefined || data.assigneeId !== undefined) {
      await ensureAssigneeCanBeAssigned(
        data.stageId ?? existingTask.stageId,
        data.assigneeId === undefined ? existingTask.assigneeId : data.assigneeId,
      );
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

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue || null;
}

async function ensureAssigneeCanBeAssigned(
  stageId: number,
  assigneeId: number | null | undefined,
) {
  const stage = await stageRepository.findById(stageId);

  if (!stage) {
    throw notFound("Stage not found");
  }

  if (assigneeId === null || assigneeId === undefined) {
    return;
  }

  const assignee = await userRepository.findById(assigneeId);

  if (!assignee) {
    throw notFound("Assignee not found");
  }

  const projectUser = await projectUserRepository.findByIds(stage.projectId, assigneeId);

  if (!projectUser) {
    throw badRequest("Assignee must be a member of the task project");
  }
}
