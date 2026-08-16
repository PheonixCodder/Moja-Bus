import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";

type Tx = PrismaClient;

/**
 * Offline refund fulfilment FSM (P1-11):
 * PENDING_FULFILMENT (OWED) → COMPLETED (PAID) | VOIDED
 */
export async function listOfflineRefundsOwed(
  prisma: Tx,
  input: { limit?: number; offset?: number } = {},
) {
  const limit = input.limit ?? 50;
  const offset = input.offset ?? 0;
  const [items, total] = await Promise.all([
    prisma.refund.findMany({
      where: {
        status: "PENDING_FULFILMENT",
        channel: { in: ["CASH", "VOUCHER"] },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
      include: {
        booking: {
          select: {
            bookingReference: true,
            passengerName: true,
            passengerPhone: true,
            companyId: true,
          },
        },
      },
    }),
    prisma.refund.count({
      where: {
        status: "PENDING_FULFILMENT",
        channel: { in: ["CASH", "VOUCHER"] },
      },
    }),
  ]);
  return { items, total, limit, offset };
}

export async function markOfflineRefundPaid(
  prisma: Tx,
  input: {
    refundId: string;
    actorUserId: string;
    note?: string | undefined;
  },
) {
  const refund = await prisma.refund.findUnique({
    where: { id: input.refundId },
  });
  if (!refund) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Refund not found" });
  }
  if (refund.status !== "PENDING_FULFILMENT") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Refund is ${refund.status}, expected PENDING_FULFILMENT`,
    });
  }
  if (refund.channel !== "CASH" && refund.channel !== "VOUCHER") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only CASH/VOUCHER offline refunds can be marked paid here",
    });
  }

  return prisma.refund.update({
    where: { id: refund.id },
    data: {
      status: "COMPLETED",
      fulfilledAt: new Date(),
      fulfilledByUserId: input.actorUserId,
      fulfilmentNote: input.note ?? null,
    },
  });
}

export async function markOfflineRefundVoid(
  prisma: Tx,
  input: {
    refundId: string;
    actorUserId: string;
    note?: string | undefined;
  },
) {
  const refund = await prisma.refund.findUnique({
    where: { id: input.refundId },
  });
  if (!refund) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Refund not found" });
  }
  if (refund.status !== "PENDING_FULFILMENT") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Refund is ${refund.status}, expected PENDING_FULFILMENT`,
    });
  }

  return prisma.refund.update({
    where: { id: refund.id },
    data: {
      status: "VOIDED",
      voidedAt: new Date(),
      voidedByUserId: input.actorUserId,
      fulfilmentNote: input.note ?? null,
    },
  });
}
