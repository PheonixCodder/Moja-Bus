import type { UserRole } from "@moja/schemas/auth";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AuthPrincipal } from "../auth/auth.types.js";
import { AppError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";

export function authenticateRequest(secret: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (typeof header !== "string" || !header.startsWith("Bearer ")) {
      next(new AppError(401, "Missing bearer access token."));
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    if (token.length === 0) {
      next(new AppError(401, "Missing bearer access token."));
      return;
    }

    try {
      const claims = verifyAccessToken(token, secret);
      req.auth = claims satisfies AuthPrincipal;
      next();
    } catch {
      next(new AppError(401, "Invalid access token."));
    }
  };
}

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) {
      next(new AppError(401, "Authentication is required."));
      return;
    }

    if (!allowedRoles.includes(auth.role)) {
      next(
        new AppError(
          403,
          "You do not have permission to access this resource.",
        ),
      );
      return;
    }

    next();
  };
}
