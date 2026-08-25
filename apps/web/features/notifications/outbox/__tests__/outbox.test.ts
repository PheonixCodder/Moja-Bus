import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@moja/db";
import { OUTBOX_TYPES } from "../enqueue";
import { retryOutboxMessage } from "../process";

/** Pure backoff used by processOutboxBatch (mirrored for unit assert). */
function backoffMs(attempts: number): number {
  const BASE = 30_000;
  const MAX = 60 * 60 * 1000;
  return Math.min(MAX, BASE * 2 ** Math.max(0, attempts - 1));
}

describe("outbox helpers", () => {
  it("exposes commercial event types", () => {
    assert.equal(OUTBOX_TYPES.BOOKING_CONFIRMED, "BOOKING_CONFIRMED");
    assert.equal(OUTBOX_TYPES.BOOKING_REFUNDED, "BOOKING_REFUNDED");
    assert.equal(OUTBOX_TYPES.TRIP_CANCELLED, "TRIP_CANCELLED");
    assert.equal(OUTBOX_TYPES.REFERRAL_REWARD, "REFERRAL_REWARD");
  });

  it("backoff doubles then caps at 1h", () => {
    assert.equal(backoffMs(1), 30_000);
    assert.equal(backoffMs(2), 60_000);
    assert.equal(backoffMs(3), 120_000);
    assert.equal(backoffMs(20), 60 * 60 * 1000);
  });
});

describe("retryOutboxMessage (F-NF-11)", () => {
  /** Captured updateMany arg shape (only the fields the assertions read). */
  type CapturedArgs = {
    where: { id?: string; status?: unknown };
    data: {
      status?: string;
      attempts?: number;
      nextAttemptAt?: Date;
      lastError?: string | null;
    };
  };

  /** Captures the updateMany args; count is injectable per scenario. */
  function stubPrisma(count: number) {
    const captured: CapturedArgs[] = [];
    const prisma = {
      outboxMessage: {
        updateMany: async (args: CapturedArgs) => {
          captured.push(args);
          return { count };
        },
      },
    } as unknown as PrismaClient;
    return { prisma, captured };
  }

  it("a DEAD row (budget exhausted) is re-queued with a FULL fresh budget", async () => {
    const { prisma, captured } = stubPrisma(1);
    const result = await retryOutboxMessage(prisma, "msg-1");
    assert.equal(result.ok, true);
    assert.equal(captured.length, 1);
    const first = captured[0];
    // Only DEAD/FAILED rows are retryable — PENDING/PROCESSING are the
    // worker's territory (attempts-equality claim guard).
    assert.deepEqual(first?.where.status, { in: ["DEAD", "FAILED"] });
    // The literal F-NF-11 defect, encoded: without this reset a DEAD row
    // (attempts == maxAttempts) would die again on its first re-attempt.
    assert.equal(first?.data.attempts, 0);
    assert.equal(first?.data.status, "PENDING");
    assert.equal(first?.data.lastError, null);
  });

  it("returns ok:false when no DEAD/FAILED row matches", async () => {
    const { prisma } = stubPrisma(0);
    const result = await retryOutboxMessage(prisma, "missing-or-active");
    assert.equal(result.ok, false);
  });
});
