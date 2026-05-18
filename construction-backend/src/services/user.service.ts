import bcrypt from "bcrypt";
import { badRequest, notFound } from "../errors/http-error";
import { userRepository } from "../repositories/user.repository";

export const roles = ["ADMIN", "MANAGER", "WORKER"] as const;
export type Role = (typeof roles)[number];

const passwordSaltRounds = 10;

export const userService = {
  async createUser(data: { email: string; password: string; role: Role }) {
    const email = normalizeEmail(data.email);
    const password = validatePassword(data.password);
    const passwordHash = await bcrypt.hash(password, passwordSaltRounds);

    return userRepository.create({ email, password: passwordHash, role: data.role });
  },

  getUsers() {
    return userRepository.findAll();
  },

  async getUser(id: number) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw notFound("User not found");
    }

    return user;
  },

  async updateUser(
    id: number,
    data: Partial<{ email: string; password: string; role: Role }>,
  ) {
    await this.getUser(id);

    const updateData: Partial<{ email: string; password: string; role: Role }> = {};

    if (data.email !== undefined) {
      updateData.email = normalizeEmail(data.email);
    }

    if (data.password !== undefined) {
      const password = validatePassword(data.password);
      updateData.password = await bcrypt.hash(password, passwordSaltRounds);
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (Object.keys(updateData).length === 0) {
      throw badRequest("At least one field is required");
    }

    return userRepository.updateById(id, updateData);
  },

  async deleteUser(id: number) {
    await this.getUser(id);

    return userRepository.deleteById(id);
  },
};

function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw badRequest("email must be valid");
  }

  return normalized;
}

function validatePassword(password: string) {
  const trimmedPassword = password.trim();

  if (trimmedPassword.length < 6) {
    throw badRequest("password must be at least 6 characters");
  }

  return trimmedPassword;
}
