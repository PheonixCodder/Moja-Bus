import type { PrismaClient } from "@moja/db";
import { getNovuClient } from "@/lib/novu";
import type { OutboxNovuPayload } from "./enqueue";

const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 60 * 60 * 1000;
// Phase 18 (P2-6) — a row stuck in PROCESSING longer than this was orphaned by
// a crash between claim and terminal write; the picker reclaims it.
const STALE_PROCESSING_MS = 15 * 60 * 1000;

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
    typeof p.subscriber.subscriberId !== "string"
    // email is optional — phone-first drivers may be email-less
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
 * Claim due PENDING/FAILED messages (plus stale PROCESSING orphans) and
 * deliver via Novu, marking SENT or rescheduling / DEAD.
 *
 * Phase 18 — attempts are incremented AT CLAIM TIME so a worker that crashes
 * mid-delivery still burns budget; without that, a poison row could crash the
 * worker on every pass forever. Reclaims log loudly so systemic crashes surface.
 */
export async function processOutboxBatch(
  prisma: PrismaClient,
  opts: { limit?: number } = {},
): Promise<ProcessOutboxResult> {
  const limit = opts.limit ?? 25;
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS);

  const due = await prisma.outboxMessage.findMany({
    where: {
      OR: [
        { status: { in: ["PENDING", "FAILED"] }, nextAttemptAt: { lte: now } },
        { status: "PROCESSING", updatedAt: { lt: staleBefore } },
      ],
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
    if (msg.status === "PROCESSING") {
      const staleForMs = now.getTime() - new Date(msg.updatedAt).getTime();
      console.warn(
        `[outbox] reclaiming stale PROCESSING message id=${msg.id} type=${msg.type} staleForMs=${Math.round(staleForMs)}`,
      );
    }

    // Claim-time attempts increment: crash-after-claim still burns budget.
    // The attempts-equality guard makes concurrent workers single-winner.
    const claimed = await prisma.outboxMessage.updateMany({
      where: {
        id: msg.id,
        status: { in: ["PENDING", "FAILED", "PROCESSING"] },
        attempts: msg.attempts,
      },
      data: {
        status: "PROCESSING",
        attempts: msg.attempts + 1,
        nextAttemptAt: now,
      },
    });
    if (claimed.count === 0) continue;

    const attempts = msg.attempts + 1;

    const payload = parsePayload(msg.payload);
    if (!payload) {
      await prisma.outboxMessage.update({
        where: { id: msg.id },
        data: {
          status: "DEAD",
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
          ...(payload.subscriber.email
            ? { email: payload.subscriber.email }
            : {}),
          ...(payload.subscriber.firstName
            ? { firstName: payload.subscriber.firstName }
            : {}),
        },
        payload: payload.data,
        transactionId: payload.transactionId,
      });

      // Phase 07 (D7) — SENT means "accepted by Novu's trigger API", NOT
      // "rendered/delivered": Novu validates payloadSchema later, during
      // workflow execution. Delivery truth is therefore guaranteed upstream by
      // the enqueue↔payloadSchema contract tests
      // (features/notifications/__tests__/payload-contracts.test.ts), not by
      // re-checking here. Do not repurpose this status without revisiting that
      // split of responsibility.
      await prisma.outboxMessage.update({
        where: { id: msg.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          lastError: null,
        },
      });
      result.sent += 1;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message.slice(0, 500)
          : "Novu trigger failed";
      const dead = attempts >= msg.maxAttempts;

      await prisma.outboxMessage.update({
        where: { id: msg.id },
        data: {
          status: dead ? "DEAD" : "FAILED",
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

/**
 * Re-queue a DEAD/FAILED message for ops retry.
 *
 * Phase 34 (F-NF-11) — resets `attempts` to 0 so a DEAD row (which by
 * definition exhausted its budget) gets a FULL fresh budget instead of dying
 * again on its first re-attempt. Retry is an explicit human action, so a
 * poison message cannot loop autonomously — the accepted trade-off is that
 * repeatedly retrying a genuinely broken payload stays possible (deliberate
 * operator judgment). Cannot race the worker claim state machine: workers
 * only claim PENDING/FAILED/stale-PROCESSING via the attempts-equality guard;
 * this write only touches DEAD/FAILED rows and lands them in PENDING.
 */
export async function retryOutboxMessage(
  prisma: PrismaClient,
  id: string,
): Promise<{ ok: boolean }> {
  const updated = await prisma.outboxMessage.updateMany({
    where: { id, status: { in: ["DEAD", "FAILED"] } },
    data: {
      status: "PENDING",
      attempts: 0,
      nextAttemptAt: new Date(),
      lastError: null,
    },
  });
  return { ok: updated.count > 0 };
}
