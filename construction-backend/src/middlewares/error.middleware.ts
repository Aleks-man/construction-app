import type { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let statusCode = 500;

  if (
    error.message === "Project name is required" ||
    error.message === "Project id must be a positive integer"
  ) {
    statusCode = 400;
  }

  if (error.message === "Project not found") {
    statusCode = 404;
  }

  res.status(statusCode).json({
    message: error.message || "Internal server error",
  });
}
