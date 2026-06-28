import type { NextFunction, Request, Response } from "express";

import { AppError } from "../lib/errors.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    message: "Internal server error.",
  });
}
