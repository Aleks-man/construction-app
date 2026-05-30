import bcrypt from "bcrypt";
import { badRequest, forbidden, notFound } from "../errors/http-error";
import { userRepository } from "../repositories/user.repository";

export const roles = ["ADMIN", "MANAGER", "WORKER"] as const;
export type Role = (typeof roles)[number];

const passwordSaltRounds = 10;
const defaultProtectedAdminEmail = "admin@test.com";

export const userService = {
  async createUser(data: UserCreateInput) {
    if (data.currentUserRole === "MANAGER" && data.role !== "WORKER") {
      throw forbidden("Managers can create only worker users");
    }

    const email = normalizeEmail(data.email);
    const password = validatePassword(data.password);
    const passwordHash = await bcrypt.hash(password, passwordSaltRounds);

    return userRepository.create({
      email,
      password: passwordHash,
      firstName: normalizeOptionalContactField(data.firstName),
      lastName: normalizeOptionalContactField(data.lastName),
      phone: normalizeOptionalContactField(data.phone),
      role: data.role,
    });
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
    data: UserUpdateInput,
  ) {
    const user = await this.getUser(id);

    if (isProtectedAdmin(user.email)) {
      throw forbidden("Demo admin account cannot be modified");
    }

    const updateData: UserUpdateData = {};

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

    if (data.firstName !== undefined) {
      updateData.firstName = normalizeOptionalContactField(data.firstName);
    }

    if (data.lastName !== undefined) {
      updateData.lastName = normalizeOptionalContactField(data.lastName);
    }

    if (data.phone !== undefined) {
      updateData.phone = normalizeOptionalContactField(data.phone);
    }

    if (Object.keys(updateData).length === 0) {
      throw badRequest("At least one field is required");
    }

    return userRepository.updateById(id, updateData);
  },

  async deleteUser(id: number, currentUser?: { id: number; role: Role }) {
    const user = await this.getUser(id);

    if (isProtectedAdmin(user.email)) {
      throw forbidden("Demo admin account cannot be deleted");
    }

    if (user.role === "ADMIN" && currentUser?.id !== id) {
      throw forbidden("Admins cannot delete other admin accounts");
    }

    return userRepository.deleteById(id);
  },
};

type UserCreateInput = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: Role;
  currentUserRole?: Role;
};

type UserUpdateInput = Partial<UserCreateInput>;

type UserUpdateData = Partial<{
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: Role;
}>;

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

function normalizeOptionalContactField(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue || null;
}

function getProtectedAdminEmail() {
  return normalizeEmailForComparison(process.env.SEED_ADMIN_EMAIL || defaultProtectedAdminEmail);
}

function isProtectedAdmin(email: string) {
  return normalizeEmailForComparison(email) === getProtectedAdminEmail();
}

function normalizeEmailForComparison(email: string) {
  return email.trim().toLowerCase();
}
