import type { Prisma } from "@moja/db";

export type OutboxDb = {
  outboxMessage: {
    create: (args: {
      data: {
        type: string;
        payload: Prisma.InputJsonValue;
        idempotencyKey: string;
        status?: "PENDING";
        nextAttemptAt?: Date;
        maxAttempts?: number;
      };
    }) => Promise<unknown>;
    findUnique: (args: {
      where: { idempotencyKey: string };
    }) => Promise<{ id: string } | null>;
  };
};

/** Novu delivery payload stored in OutboxMessage.payload */
export type OutboxNovuPayload = {
  workflowId: string;
  subscriber: {
    subscriberId: string;
    email: string;
    firstName?: string;
  };
  data: Record<string, unknown>;
  /** Novu transactionId — usually equals outbox idempotencyKey */
  transactionId: string;
};

export const OUTBOX_TYPES = {
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_REFUNDED: "BOOKING_REFUNDED",
  TRIP_CANCELLED: "TRIP_CANCELLED",
  REFERRAL_ATTRIBUTED: "REFERRAL_ATTRIBUTED",
  REFERRAL_REWARD: "REFERRAL_REWARD",
  HOLD_CREATED: "HOLD_CREATED",
} as const;

export type OutboxType = (typeof OUTBOX_TYPES)[keyof typeof OUTBOX_TYPES];

/**
 * Enqueue a Novu delivery in the same DB transaction as the commercial write.
 * Idempotent on `idempotencyKey` (skip if already present).
 */
export async function enqueueOutboxMessage(
  db: OutboxDb,
  input: {
    type: string;
    idempotencyKey: string;
    payload: OutboxNovuPayload;
    maxAttempts?: number;
  },
): Promise<{ enqueued: boolean }> {
  const email = input.payload.subscriber.email?.trim();
  if (!email) {
    return { enqueued: false };
  }

  const existing = await db.outboxMessage.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    return { enqueued: false };
  }

  try {
    await db.outboxMessage.create({
      data: {
        type: input.type,
        payload: {
          ...input.payload,
          subscriber: {
            ...input.payload.subscriber,
            email,
          },
        } as Prisma.InputJsonValue,
        idempotencyKey: input.idempotencyKey,
        status: "PENDING",
        nextAttemptAt: new Date(),
        ...(input.maxAttempts != null
          ? { maxAttempts: input.maxAttempts }
          : {}),
      },
    });
    return { enqueued: true };
  } catch (err: unknown) {
    // Unique race — treat as already enqueued
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : null;
    if (code === "P2002") {
      return { enqueued: false };
    }
    throw err;
  }
}
