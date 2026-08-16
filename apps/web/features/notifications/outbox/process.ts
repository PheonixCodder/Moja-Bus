import type { PrismaClient } from "@moja/db";
import { getNovuClient } from "@/lib/novu";
import type { OutboxNovuPayload } from "./enqueue";

const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 60 * 60 * 1000;

function backoffMs(attempts: number): number {
  const exp = Math.min(
    MAX_BACKOFF_MS,
    BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1),
  );
  return exp;
}

function parsePayload(raw: unknown): OutboxNovuPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<OutboxNovuPayload>;
  if (
    typeof p.workflowId !== "string" ||
    typeof p.transactionId !== "string" ||
    !p.subscriber ||
    typeof p.subscriber.email !== "string"
  ) {
    return null;
  }
  return p as OutboxNovuPayload;
}

export type ProcessOutboxResult = {
  claimed: number;
  sent: number;
  failed: number;
  dead: number;
  skippedNoNovu: number;
};

/**
 * Claim due PENDING/FAILED messages, deliver via Novu, mark SENT or reschedule / DEAD.
 */
export async function processOutboxBatch(
  prisma: PrismaClient,
  opts: { limit?: number } = {},
): Promise<ProcessOutboxResult> {
  const limit = opts.limit ?? 25;
  const now = new Date();

  const due = await prisma.outboxMessage.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      nextAttemptAt: { lte: now },
    },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
  });

  const result: ProcessOutboxResult = {
    claimed: due.length,
    sent: 0,
    failed: 0,
    dead: 0,
    skippedNoNovu: 0,
  };

  if (due.length === 0) return result;

  const novu = getNovuClient();
  if (!novu) {
    result.skippedNoNovu = due.length;
    return result;
  }

  for (const msg of due) {
    const claimed = await prisma.outboxMessage.updateMany({
      where: {
        id: msg.id,
        status: { in: ["PENDING", "FAILED"] },
        attempts: msg.attempts,
      },
      data: { status: "PROCESSING" },
    });
    if (claimed.count === 0) continue;

    const payload = parsePayload(msg.payload);
    if (!payload) {
      await prisma.outboxMessage.update({
        where: { id: msg.id },
        data: {
          status: "DEAD",
          attempts: msg.attempts + 1,
          lastError: "Invalid outbox payload shape",
          nextAttemptAt: now,
        },
      });
      result.dead += 1;
      continue;
    }

    try {
      await novu.trigger({
        workflowId: payload.workflowId,
        to: {
          subscriberId: payload.subscriber.subscriberId,
          email: payload.subscriber.email,
          ...(payload.subscriber.firstName
            ? { firstName: payload.subscriber.firstName }
            : {}),
        },
        payload: payload.data,
        transactionId: payload.transactionId,
      });

      await prisma.outboxMessage.update({
        where: { id: msg.id },
        data: {
          status: "SENT",
          attempts: msg.attempts + 1,
          sentAt: new Date(),
          lastError: null,
        },
      });
      result.sent += 1;
    } catch (err) {
      const attempts = msg.attempts + 1;
      const errorMessage =
        err instanceof Error ? err.message.slice(0, 500) : "Novu trigger failed";
      const dead = attempts >= msg.maxAttempts;

      await prisma.outboxMessage.update({
        where: { id: msg.id },
        data: {
          status: dead ? "DEAD" : "FAILED",
          attempts,
          lastError: errorMessage,
          nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
        },
      });

      if (dead) result.dead += 1;
      else result.failed += 1;

      console.error(
        `[outbox] delivery failed id=${msg.id} type=${msg.type} attempt=${attempts}:`,
        errorMessage,
      );
    }
  }

  return result;
}

/** Re-queue a DEAD/FAILED message for ops retry. */
export async function retryOutboxMessage(
  prisma: PrismaClient,
  id: string,
): Promise<{ ok: boolean }> {
  const updated = await prisma.outboxMessage.updateMany({
    where: { id, status: { in: ["DEAD", "FAILED"] } },
    data: {
      status: "PENDING",
      nextAttemptAt: new Date(),
      lastError: null,
    },
  });
  return { ok: updated.count > 0 };
}
