import type { PrismaClient } from "@moja/db";
import { releaseDiscountReservations } from "@/features/discounts/services/quote-service";

export type ExpireOrReleaseReason =
  | "EXPIRED"
  | "RELEASED"
  | "PAYMENT_FAILED"
  | "RECONCILE_FAILED";

export type ExpireOrReleaseResult = {
  holdGroupId: string;
  /** true when this call performed a terminal transition */
  transitioned: boolean;
  status: string;
  reason: ExpireOrReleaseReason;
};

/**
 * Idempotent hold terminalization: release incentive reservations, expire
 * PENDING_PAYMENT bookings, set HoldGroup to EXPIRED (time/fail) or CANCELLED (user).
 */
export async function expireOrReleaseHold(
  prisma: PrismaClient,
  input: {
    holdGroupId: string;
    reason: ExpireOrReleaseReason;
    /** When false, only expire if holdExpiresAt is past (or already soft-expired). Default true for explicit release. */
    force?: boolean;
  },
): Promise<ExpireOrReleaseResult> {
  const force = input.force ?? true;

  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "hold_group" WHERE id = ${input.holdGroupId} FOR UPDATE
    `;
    if (locked.length === 0) {
      return {
        holdGroupId: input.holdGroupId,
        transitioned: false,
        status: "MISSING",
        reason: input.reason,
      };
    }

    const hold = await tx.holdGroup.findUniqueOrThrow({
      where: { id: input.holdGroupId },
      select: {
        id: true,
        status: true,
        holdExpiresAt: true,
      },
    });

    if (hold.status !== "ACTIVE") {
      // Still clear any stranded RESERVED redemptions (crash recovery).
      await releaseDiscountReservations(tx, hold.id);
      return {
        holdGroupId: hold.id,
        transitioned: false,
        status: hold.status,
        reason: input.reason,
      };
    }

    const now = new Date();
    if (!force && hold.holdExpiresAt.getTime() > now.getTime()) {
      return {
        holdGroupId: hold.id,
        transitioned: false,
        status: hold.status,
        reason: input.reason,
      };
    }

    await releaseDiscountReservations(tx, hold.id);

    await tx.booking.updateMany({
      where: { holdGroupId: hold.id, status: "PENDING_PAYMENT" },
      data: { status: "EXPIRED", holdExpiresAt: null },
    });

    const nextStatus =
      input.reason === "RELEASED" ? "CANCELLED" : "EXPIRED";

    await tx.holdGroup.update({
      where: { id: hold.id },
      data: { status: nextStatus },
    });

    // Close abandoned checkout payment attempts (best-effort hygiene).
    const payment = await tx.externalPayment.findFirst({
      where: { holdGroupId: hold.id, status: { in: ["INITIALIZED", "PENDING"] } },
      select: { id: true },
    });
    if (payment) {
      await tx.externalPayment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      await tx.paymentAttempt.updateMany({
        where: {
          paymentId: payment.id,
          status: { in: ["INITIALIZED", "PENDING"] },
        },
        data: { status: "FAILED" },
      });
    }

    return {
      holdGroupId: hold.id,
      transitioned: true,
      status: nextStatus,
      reason: input.reason,
    };
  });
}

/**
 * Sweep ACTIVE holds past holdExpiresAt (batch-limited).
 */
export async function sweepExpiredHolds(
  prisma: PrismaClient,
  opts?: { limit?: number },
): Promise<{ scanned: number; released: number }> {
  const limit = opts?.limit ?? 50;
  const now = new Date();
  const expired = await prisma.holdGroup.findMany({
    where: {
      status: "ACTIVE",
      holdExpiresAt: { lt: now },
    },
    select: { id: true },
    orderBy: { holdExpiresAt: "asc" },
    take: limit,
  });

  let released = 0;
  for (const h of expired) {
    const result = await expireOrReleaseHold(prisma, {
      holdGroupId: h.id,
      reason: "EXPIRED",
      force: true,
    });
    if (result.transitioned) released++;
  }

  return { scanned: expired.length, released };
}
