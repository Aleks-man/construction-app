import { prisma } from "../prisma";

const stageInclude = {
  project: true,
  tasks: true,
};

export const stageRepository = {
  create(data: { name: string; projectId: number }) {
    return prisma.stage.create({
      data,
      include: stageInclude,
    });
  },

  findAll(projectId?: number) {
    return prisma.stage.findMany({
      where: projectId ? { projectId } : undefined,
      include: stageInclude,
      orderBy: { id: "asc" },
    });
  },

  findById(id: number) {
    return prisma.stage.findUnique({
      where: { id },
      include: stageInclude,
    });
  },

  updateById(id: number, data: Partial<{ name: string; projectId: number }>) {
    return prisma.stage.update({
      where: { id },
      data,
      include: stageInclude,
    });
  },

  deleteById(id: number) {
    return prisma.stage.delete({
      where: { id },
    });
  },
};
