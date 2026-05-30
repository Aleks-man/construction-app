import { badRequest, forbidden, notFound } from "../errors/http-error";
import { projectUserRepository } from "../repositories/project-user.repository";
import { stageRepository } from "../repositories/stage.repository";
import { taskRepository } from "../repositories/task.repository";
import { userRepository } from "../repositories/user.repository";
import { activityService, type ActivityActor } from "./activity.service";
import { ensureActorCanManageProject } from "./project-permission.service";
import type { Role } from "./user.service";

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
  }, actor?: ActivityActor) {
    const stage = await stageRepository.findById(data.stageId);

    if (!stage) {
      throw notFound("Stage not found");
    }

    await ensureActorCanManageProject(stage.projectId, actor);
    await ensureAssigneeCanBeAssigned(data.stageId, data.assigneeId);
    ensureDueDateIsNotPast(data.dueDate);
    ensureStatusHasAssignee(data.status ?? "NEW", data.assigneeId);

    const task = await taskRepository.create({
      title: normalizeTitle(data.title),
      description: normalizeOptionalText(data.description),
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      stageId: data.stageId,
      assigneeId: data.assigneeId,
    });

    await activityService.record({
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task.id,
      message: `created task "${task.title}" in stage "${task.stage.name}"`,
      projectId: task.stage.projectId,
      actor,
    });

    return task;
  },

  async getTasks(filters: {
    stageId?: number;
    assigneeId?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueBefore?: Date;
    dueAfter?: Date;
  }, actor?: ActivityActor) {
    if (filters.dueBefore && filters.dueAfter && filters.dueAfter > filters.dueBefore) {
      throw badRequest("dueAfter must be before dueBefore");
    }

    const visibilityFilters = await getTaskVisibilityFilters(actor);

    return taskRepository.findAll({
      ...filters,
      ...visibilityFilters,
    });
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
    actor?: ActivityActor,
  ) {
    const existingTask = await this.getTask(id);
    await ensureActorCanManageProject(existingTask.stage.projectId, actor);

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
      ensureDueDateIsNotPast(data.dueDate);
      updateData.dueDate = data.dueDate;
    }

    if (data.stageId !== undefined) {
      updateData.stageId = data.stageId;
    }

    if (data.assigneeId !== undefined) {
      updateData.assigneeId = data.assigneeId;
    }

    if (data.stageId !== undefined || data.assigneeId !== undefined) {
      if (data.stageId !== undefined) {
        const newStage = await stageRepository.findById(data.stageId);

        if (!newStage) {
          throw notFound("Stage not found");
        }

        await ensureActorCanManageProject(newStage.projectId, actor);
      }

      await ensureAssigneeCanBeAssigned(
        data.stageId ?? existingTask.stageId,
        data.assigneeId === undefined ? existingTask.assigneeId : data.assigneeId,
      );
    }

    ensureStatusHasAssignee(
      data.status ?? existingTask.status,
      data.assigneeId === undefined ? existingTask.assigneeId : data.assigneeId,
    );

    if (Object.keys(updateData).length === 0) {
      throw badRequest("At least one field is required");
    }

    const task = await taskRepository.updateById(id, updateData);

    await activityService.record({
      action: "TASK_UPDATED",
      entityType: "TASK",
      entityId: task.id,
      message: `updated task "${task.title}"`,
      projectId: task.stage.projectId,
      actor,
    });

    return task;
  },

  async updateTaskStatus(
    id: number,
    status: TaskStatus,
    currentUser: { id: number; role: Role },
  ) {
    const task = await this.getTask(id);

    if (currentUser.role === "MANAGER") {
      await ensureActorCanManageProject(task.stage.projectId, currentUser);
    }

    if (currentUser.role === "WORKER" && task.assigneeId !== currentUser.id) {
      throw forbidden("Workers can update only their assigned tasks");
    }

    ensureStatusHasAssignee(status, task.assigneeId);

    const updatedTask = await taskRepository.updateById(id, { status });

    await activityService.record({
      action: "TASK_STATUS_UPDATED",
      entityType: "TASK",
      entityId: updatedTask.id,
      message: `changed task "${updatedTask.title}" status from ${task.status} to ${updatedTask.status}`,
      projectId: updatedTask.stage.projectId,
      actor: currentUser,
    });

    return updatedTask;
  },

  async deleteTask(id: number, actor?: ActivityActor) {
    const task = await this.getTask(id);
    await ensureActorCanManageProject(task.stage.projectId, actor);

    await activityService.record({
      action: "TASK_DELETED",
      entityType: "TASK",
      entityId: task.id,
      message: `deleted task "${task.title}"`,
      projectId: task.stage.projectId,
      actor,
    });

    return taskRepository.deleteById(id);
  },
};

async function getTaskVisibilityFilters(actor?: ActivityActor) {
  if (!actor || actor.role === "ADMIN") {
    return {};
  }

  if (actor.role === "WORKER") {
    return {
      assigneeId: actor.id,
    };
  }

  if (actor.role === "MANAGER") {
    const projectUsers = await projectUserRepository.findProjectIdsByUserId(actor.id);

    return {
      projectIds: projectUsers.map((projectUser) => projectUser.projectId),
    };
  }

  return {};
}

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

function ensureDueDateIsNotPast(dueDate: Date | null | undefined) {
  if (!dueDate) {
    return;
  }

  if (dueDate < startOfToday()) {
    throw badRequest("dueDate cannot be in the past");
  }
}

function ensureStatusHasAssignee(status: TaskStatus, assigneeId: number | null | undefined) {
  if (status !== "NEW" && !assigneeId) {
    throw badRequest("Task must have an assignee before status can be changed");
  }
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
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
