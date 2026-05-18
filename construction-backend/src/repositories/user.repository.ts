import { prisma } from "../prisma";

const userSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
};

const userWithPasswordSelect = {
  ...userSelect,
  password: true,
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

  findByEmailWithPassword(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: userWithPasswordSelect,
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
