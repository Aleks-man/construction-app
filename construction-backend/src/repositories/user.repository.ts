import { prisma } from "../prisma";

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  createdAt: true,
};

const userWithPasswordSelect = {
  ...userSelect,
  password: true,
};

export const userRepository = {
  create(data: UserCreateData) {
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
    data: UserUpdateData,
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  },

  deleteById(id: number) {
    return prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: null },
      });

      await tx.projectUser.deleteMany({
        where: { userId: id },
      });

      return tx.user.delete({
        where: { id },
        select: userSelect,
      });
    });
  },
};

type UserCreateData = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: "ADMIN" | "MANAGER" | "WORKER";
};

type UserUpdateData = Partial<UserCreateData>;
