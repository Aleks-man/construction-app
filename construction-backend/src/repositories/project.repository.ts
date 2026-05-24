import { prisma } from "../prisma";

export const projectRepository = {
  create(name: string) {
    return prisma.project.create({
      data: { name },
      include: projectInclude,
    });
  },

  findAll() {
    return prisma.project.findMany({
      include: projectInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: number) {
    return prisma.project.findUnique({
      where: { id },
      include: projectInclude,
    });
  },

  updateById(id: number, name: string) {
    return prisma.project.update({
      where: { id },
      data: { name },
      include: projectInclude,
    });
  },

  deleteById(id: number) {
    return prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({
        where: {
          stage: {
            projectId: id,
          },
        },
      });

      await tx.stage.deleteMany({
        where: { projectId: id },
      });

      await tx.projectUser.deleteMany({
        where: { projectId: id },
      });

      return tx.project.delete({
        where: { id },
      });
    });
  },
};

const projectInclude = {
  users: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
    },
  },
  stages: {
    include: {
      tasks: true,
    },
    orderBy: {
      id: "asc" as const,
    },
  },
};
