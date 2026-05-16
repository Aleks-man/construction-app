import { prisma } from "../prisma";

const userSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
};

export const userRepository = {
  create(data: { email: string; password: string; role: "ADMIN" | "MANAGER" | "WORKER" }) {
    return prisma.user.create({
      data,
      select: userSelect,
    });
  },

  findAll() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  updateById(
    id: number,
    data: Partial<{ email: string; password: string; role: "ADMIN" | "MANAGER" | "WORKER" }>,
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  },

  deleteById(id: number) {
    return prisma.user.delete({
      where: { id },
      select: userSelect,
    });
  },
};
