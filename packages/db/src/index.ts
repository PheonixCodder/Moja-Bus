import { createRequire } from "node:module";
import { getOptionalEnv, getRequiredEnv } from "@moja/config";
import { PrismaClient } from "@prisma/client";
import type { SqlDriverAdapterFactory } from "@prisma/client/runtime/client";

const globalForPrisma = globalThis as typeof globalThis & {
  __mojaPrismaClient?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const require = createRequire(import.meta.url);
  const { PrismaPg } = require("@prisma/adapter-pg") as {
    PrismaPg: new (poolOrConfig: string) => SqlDriverAdapterFactory;
  };

  const adapter = new PrismaPg(getRequiredEnv("DATABASE_URL"));

  return new PrismaClient({ adapter });
}

function isStaleDevClient(client: PrismaClient): boolean {
  return (
    getOptionalEnv("NODE_ENV") === "development" &&
    !("bankAccessLog" in client)
  );
}

export function getPrismaClient(): PrismaClient {
  const existingClient = globalForPrisma.__mojaPrismaClient;
  if (existingClient) {
    if (isStaleDevClient(existingClient)) {
      delete globalForPrisma.__mojaPrismaClient;
      return getPrismaClient();
    }
    return existingClient;
  }

  const client = createPrismaClient();
  if (getOptionalEnv("NODE_ENV") !== "production") {
    globalForPrisma.__mojaPrismaClient = client;
  }

  return client;
}
export * from "@prisma/client";
