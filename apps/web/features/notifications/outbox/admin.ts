import type { PrismaClient } from "@moja/db";
import { retryOutboxMessage } from "./process";

type OutboxStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "DEAD";

export async function listOutboxMessages(
  prisma: PrismaClient,
  input: {
    status?: OutboxStatus | "NEEDS_ATTENTION";
    limit?: number;
    offset?: number;
  },
) {
  const limit = input.limit ?? 50;
  const offset = input.offset ?? 0;

  const where =
    input.status === "NEEDS_ATTENTION" || input.status == null
      ? { status: { in: ["FAILED", "DEAD"] as OutboxStatus[] } }
      : { status: input.status };

  const [items, total] = await Promise.all([
    prisma.outboxMessage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        lastError: true,
        idempotencyKey: true,
        nextAttemptAt: true,
        createdAt: true,
        updatedAt: true,
        sentAt: true,
      },
    }),
    prisma.outboxMessage.count({ where }),
  ]);

  return { items, total };
}

export async function retryOutboxMessageAdmin(
  prisma: PrismaClient,
  id: string,
) {
  return retryOutboxMessage(prisma, id);
}
