import { prisma } from "../prisma";

const taskInclude = {
  stage: true,
  assignee: {
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  },
};

export const taskRepository = {
  create(data: {
    title: string;
    description?: string | null;
    status?: "NEW" | "IN_PROGRESS" | "DONE";
    priority?: "LOW" | "MEDIUM" | "HIGH";
    dueDate?: Date | null;
    stageId: number;
    assigneeId?: number | null;
  }) {
    return prisma.task.create({
      data,
      include: taskInclude,
    });
  },

  findAll(filters: {
    stageId?: number;
    assigneeId?: number;
    status?: "NEW" | "IN_PROGRESS" | "DONE";
    priority?: "LOW" | "MEDIUM" | "HIGH";
    dueBefore?: Date;
    dueAfter?: Date;
  }) {
    return prisma.task.findMany({
      where: {
        stageId: filters.stageId,
        assigneeId: filters.assigneeId,
        status: filters.status,
        priority: filters.priority,
        dueDate:
          filters.dueBefore || filters.dueAfter
            ? {
                lte: filters.dueBefore,
                gte: filters.dueAfter,
              }
            : undefined,
      },
      include: taskInclude,
      orderBy: [{ dueDate: "asc" }, { id: "desc" }],
    });
  },

  findById(id: number) {
    return prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });
  },

  updateById(
    id: number,
    data: Partial<{
      title: string;
      description: string | null;
      status: "NEW" | "IN_PROGRESS" | "DONE";
      priority: "LOW" | "MEDIUM" | "HIGH";
      dueDate: Date | null;
      stageId: number;
      assigneeId: number | null;
    }>,
  ) {
    return prisma.task.update({
      where: { id },
      data,
      include: taskInclude,
    });
  },

  deleteById(id: number) {
    return prisma.task.delete({
      where: { id },
    });
  },
};
