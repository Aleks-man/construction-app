import { prisma } from "../prisma";

export const projectRepository = {
  create(name: string) {
    return prisma.project.create({
      data: { name },
    });
  },

  findAll() {
    return prisma.project.findMany();
  },

  findById(id: number) {
    return prisma.project.findUnique({
      where: { id },
    });
  },

  deleteById(id: number) {
    return prisma.project.delete({
      where: { id },
    });
  },
};
