import {
  authResponseSchema,
  type LoginInput,
  loginInputSchema,
  type RefreshInput,
  type RegisterInput,
  refreshInputSchema,
  registerInputSchema,
} from "@moja/schemas/auth";
import {
  type Router as ExpressRouter,
  type Request,
  type Response,
  Router,
} from "express";
import type { ZodTypeAny } from "zod";

import { AppError } from "../lib/errors.js";
import type { AuthService } from "./auth.service.js";

function parseBody<T>(schema: ZodTypeAny, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(
      400,
      "Request validation failed.",
      result.error?.flatten(),
    );
  }

  return result.data as T;
}

function sendAuthResponse(
  response: Response,
  statusCode: number,
  payload: unknown,
) {
  response.status(statusCode).json(authResponseSchema.parse(payload));
}

export function createAuthRouter(authService: AuthService): ExpressRouter {
  const router = Router();

  router.post("/register", async (req: Request, res: Response) => {
    const input = parseBody<RegisterInput>(registerInputSchema, req.body);
    const result = await authService.register(input);
    sendAuthResponse(res, 201, result);
  });

  router.post("/login", async (req: Request, res: Response) => {
    const input = parseBody<LoginInput>(loginInputSchema, req.body);
    const result = await authService.login(input);
    sendAuthResponse(res, 200, result);
  });

  router.post("/refresh", async (req: Request, res: Response) => {
    const input = parseBody<RefreshInput>(refreshInputSchema, req.body);
    const result = await authService.refresh(input);
    sendAuthResponse(res, 200, result);
  });

  return router;
}
