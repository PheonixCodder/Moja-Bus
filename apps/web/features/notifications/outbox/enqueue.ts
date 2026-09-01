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
    /** Optional — phone-first drivers may be email-less; in-app/push still deliver. */
    email?: string;
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
  // Phase 11 — Driver employment offer board
  OFFER_SENT_TO_DRIVER: "OFFER_SENT_TO_DRIVER",
  OFFER_COUNTERED_BY_DRIVER: "OFFER_COUNTERED_BY_DRIVER",
  OFFER_COUNTERED_BY_OPERATOR: "OFFER_COUNTERED_BY_OPERATOR",
  OFFER_ACCEPTED: "OFFER_ACCEPTED",
  OFFER_DECLINED: "OFFER_DECLINED",
  OFFER_WITHDRAWN: "OFFER_WITHDRAWN",
  OFFER_EXPIRING_SOON: "OFFER_EXPIRING_SOON",
  OFFER_EXPIRED: "OFFER_EXPIRED",
  DRIVER_AFFILIATION_ENDED: "DRIVER_AFFILIATION_ENDED",
  // Phase 12 — Dispatch board assignments
  TRIP_ASSIGNED_TO_DRIVER: "TRIP_ASSIGNED_TO_DRIVER",
  TRIP_UNASSIGNED_FROM_DRIVER: "TRIP_UNASSIGNED_FROM_DRIVER",
  // Phase 19 (P3-6) — bus assignment notices ride the outbox too
  BUS_ASSIGNED_TO_OPERATOR: "BUS_ASSIGNED_TO_OPERATOR",
  // Phase 19 (P3-5) — delay-created driver scheduling overlap
  DRIVER_ASSIGNMENT_CONFLICT: "DRIVER_ASSIGNMENT_CONFLICT",
  // Phase 14 — Admin marketplace controls
  DRIVER_MARKETPLACE_FEATURED: "DRIVER_MARKETPLACE_FEATURED",
  DRIVER_MARKETPLACE_SUSPENDED: "DRIVER_MARKETPLACE_SUSPENDED",
  // Phase 17 — Operator bank verification outcomes (D5)
  OPERATOR_BANK_VERIFIED: "OPERATOR_BANK_VERIFIED",
  OPERATOR_BANK_REJECTED: "OPERATOR_BANK_REJECTED",
  // Phase 07 (F-NF-02) — passenger delay notices ride the outbox (both paths)
  TRIP_DELAYED: "TRIP_DELAYED",
  // Phase 13 (F-OP-02) — operator-initiated roster removal notice
  DRIVER_ROSTER_REMOVED: "DRIVER_ROSTER_REMOVED",
  // Phase 14 (F-OP-03/F-DV-12) — licence expiry warning + flip notices
  DRIVER_LICENSE_STATUS: "DRIVER_LICENSE_STATUS",
  // Phase 25 (F-OP-09) — platform verification outcome notice to the driver
  DRIVER_VERIFICATION_OUTCOME: "DRIVER_VERIFICATION_OUTCOME",
  // Phase 22 (F-NF-07) — discount campaign budget ceiling reached
  CAMPAIGN_BUDGET_EXHAUSTED: "CAMPAIGN_BUDGET_EXHAUSTED",
  // Phase 33 (F-PS-16) — operator rebooking confirmation to the passenger
  PASSENGER_REBOOKED: "PASSENGER_REBOOKED",
  // Phase 37 — post-arrival review request (outbox-migrated)
  PASSENGER_REVIEW_REQUEST: "PASSENGER_REVIEW_REQUEST",
  // Phase 2D (DRV-P1-07) — roadside vehicle breakdown emergency alert to operators
  OPERATOR_VEHICLE_BREAKDOWN: "OPERATOR_VEHICLE_BREAKDOWN",
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
            ...(input.payload.subscriber.email
              ? { email: input.payload.subscriber.email.trim() }
              : {}),
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
