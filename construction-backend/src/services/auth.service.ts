import bcrypt from "bcrypt";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { unauthorized } from "../errors/http-error";
import { userRepository } from "../repositories/user.repository";
import { Role } from "./user.service";

type JwtUser = {
  id: number;
  email: string;
  role: Role;
};

type AuthTokenPayload = {
  sub: string;
  email: string;
  role: Role;
};

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1d";

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set");
}

export const authService = {
  async login(data: { email: string; password: string }) {
    const email = data.email.trim().toLowerCase();
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
      throw unauthorized("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw unauthorized("Invalid email or password");
    }

    const safeUser = toJwtUser(user);
    const token = signToken(safeUser);

    return {
      token,
      user: safeUser,
    };
  },

  verifyToken(token: string) {
    try {
      const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload;

      return {
        id: Number(payload.sub),
        email: payload.email,
        role: payload.role,
      };
    } catch {
      throw unauthorized("Invalid or expired token");
    }
  },
};

function signToken(user: JwtUser) {
  const payload: AuthTokenPayload = {
    sub: String(user.id),
    email: user.email,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, jwtSecret as Secret, options);
}

function toJwtUser(user: JwtUser) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}
