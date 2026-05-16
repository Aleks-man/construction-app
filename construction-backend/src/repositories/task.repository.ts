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
    status?: "NEW" | "IN_PROGRESS" | "DONE";
    stageId: number;
    assigneeId?: number | null;
  }) {
    return prisma.task.create({
      data,
      include: taskInclude,
    });
  },

  findAll(filters: { stageId?: number; assigneeId?: number; status?: "NEW" | "IN_PROGRESS" | "DONE" }) {
    return prisma.task.findMany({
      where: filters,
      include: taskInclude,
      orderBy: { id: "desc" },
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
      status: "NEW" | "IN_PROGRESS" | "DONE";
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
