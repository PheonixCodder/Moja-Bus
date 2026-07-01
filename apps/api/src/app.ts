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
import { createOperatorRouter } from "./routes/operator.js";
import { createFleetRouter } from "./routes/fleet.js";
import { createRoutesRouter } from "./routes/routes-waypoints.js";
import { createSchedulesRouter } from "./routes/schedules.js";
import { createTripsRouter } from "./routes/trips.js";
import { createStaffRouter } from "./routes/staff.js";
import { createInvitationsRouter } from "./routes/invitations.js";

export interface CreateApiAppOptions {
  allowedOrigins?: string[];
}

function loadAllowedOrigins(options: CreateApiAppOptions): string[] {
  if (options.allowedOrigins) {
    return options.allowedOrigins;
  }

  const origins = getCsvEnv("ALLOWED_ORIGINS", process.env, [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:19006",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:19006",
  ]);

  // Add Expo and mobile app origins in development
  if (process.env["NODE_ENV"] === "development") {
    origins.push(
      "exp://*",
      "http://192.168.100.3:8081",
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      "travelerapp://",
    );
  }

  return origins;
}

export function createApiApp(options: CreateApiAppOptions = {}): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = loadAllowedOrigins(options);
        // Allow requests without origin (mobile apps, same-origin requests)
        if (!origin) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Check for wildcard matches (e.g., exp://*)
        const originMatches = allowedOrigins.some((allowedOrigin) => {
          if (allowedOrigin.endsWith("*")) {
            const prefix = allowedOrigin.slice(0, -1);
            return origin.startsWith(prefix);
          }
          return false;
        });
        if (originMatches) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(compression());
  app.all("/api/auth/{*any}", toNodeHandler(auth));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/v1", createHealthRouter());
  app.use("/api/v1", createOperatorRouter());
  app.use("/api/v1", createFleetRouter());
  app.use("/api/v1", createRoutesRouter());
  app.use("/api/v1", createSchedulesRouter());
  app.use("/api/v1", createTripsRouter());
  app.use("/api/v1", createStaffRouter());
  app.use("/api/v1", createInvitationsRouter());

  app.use(errorHandler);

  return app;
}
