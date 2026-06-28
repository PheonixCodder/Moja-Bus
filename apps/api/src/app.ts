import "dotenv/config";

import { getCsvEnv } from "@moja/config";
import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./auth/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createHealthRouter } from "./routes/health.js";

export interface CreateApiAppOptions {
  allowedOrigins?: string[];
}

function loadAllowedOrigins(options: CreateApiAppOptions): string[] {
  if (options.allowedOrigins) {
    return options.allowedOrigins;
  }

  return getCsvEnv("ALLOWED_ORIGINS", process.env, [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:19006",
  ]);
}

export function createApiApp(options: CreateApiAppOptions = {}): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: loadAllowedOrigins(options),
      credentials: true,
    }),
  );
  app.use(compression());
  app.all("/api/auth/{*any}", toNodeHandler(auth));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/v1", createHealthRouter());

  app.use(errorHandler);

  return app;
}
