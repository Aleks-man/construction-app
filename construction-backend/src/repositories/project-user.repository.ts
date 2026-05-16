import { prisma } from "../prisma";

const projectUserInclude = {
  project: true,
  user: {
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  },
};

export const projectUserRepository = {
  create(data: { projectId: number; userId: number }) {
    return prisma.projectUser.create({
      data,
      include: projectUserInclude,
    });
  },

  findAll(projectId?: number) {
    return prisma.projectUser.findMany({
      where: projectId ? { projectId } : undefined,
      include: projectUserInclude,
      orderBy: [{ projectId: "asc" }, { userId: "asc" }],
    });
  },

  findByIds(projectId: number, userId: number) {
    return prisma.projectUser.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: projectUserInclude,
    });
  },

  deleteByIds(projectId: number, userId: number) {
    return prisma.projectUser.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: projectUserInclude,
    });
  },
};
