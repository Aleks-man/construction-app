import { prisma } from "../prisma";

export const activityRepository = {
  create(data: {
    action: string;
    entityType: string;
    entityId?: number | null;
    message: string;
    projectId: number;
    userId?: number | null;
  }) {
    return prisma.activityLog.create({
      data,
      include: activityInclude,
    });
  },

  findByProjectId(projectId: number) {
    return prisma.activityLog.findMany({
      where: { projectId },
      include: activityInclude,
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });
  },
};

const activityInclude = {
  user: {
    select: {
      id: true,
      email: true,
      role: true,
    },
  },
};
