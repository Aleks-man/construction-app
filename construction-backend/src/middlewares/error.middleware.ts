import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { conflict, HttpError } from "../errors/http-error";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mappedError = mapPrismaError(error);
    res.status(mappedError.statusCode).json({ message: mappedError.message });
    return;
  }

  const message = error instanceof Error ? error.message : "Internal server error";

  res.status(500).json({ message });
}

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError) {
  if (error.code === "P2002") {
    return conflict("Record with this unique field already exists");
  }

  if (error.code === "P2003") {
    return conflict("Record is used by another entity");
  }

  if (error.code === "P2025") {
    return conflict("Record was not found or cannot be changed");
  }

  return new HttpError(500, "Database error");
}
