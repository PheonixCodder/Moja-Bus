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
        channel: "CASH",
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
        channel: "CASH",
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
  if (refund.channel !== "CASH") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only CASH offline refunds can be marked paid here",
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
    include: {
      booking: true,
      holdGroup: {
        include: { pricingSnapshot: true },
      },
    },
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

  return prisma.$transaction(async (tx) => {
    const updated = await tx.refund.update({
      where: { id: refund.id },
      data: {
        status: "VOIDED",
        voidedAt: new Date(),
        voidedByUserId: input.actorUserId,
        fulfilmentNote: input.note ?? null,
      },
    });

    if (refund.amountXOF > 0 && refund.channel === "CASH") {
      const { AccountingEngine, FinancialAccountService } = await import(
        "@moja/db"
      );
      const accountService = new FinancialAccountService(tx as any);
      const reimbursementPayable =
        await accountService.getOfflineRefundPayableAccount();

      const snapshot = refund.holdGroup?.pricingSnapshot;
      const operatorNet = snapshot
        ? Math.round(snapshot.operatorNetXOF / snapshot.seatCount)
        : Math.max(0, refund.amountXOF - Math.round((refund.amountXOF * 500) / 10000));
      const commission = Math.max(0, refund.amountXOF - operatorNet);

      const engine = new AccountingEngine("REFUND_VOID", {
        description: `Void reversal for offline cash refund ${refund.id}`,
        idempotencyKey: `REFUND_VOID_${refund.id}`,
        metadata: { refundId: refund.id, bookingId: refund.bookingId },
      });

      let seq = 1;
      engine.addDebit({
        accountId: reimbursementPayable.id,
        amount: refund.amountXOF,
        sequenceNumber: seq++,
        referenceType: "REFUND",
        referenceId: refund.id,
        description: "Clear offline reimbursement payable on void",
      });

      if (operatorNet > 0 && refund.booking?.companyId) {
        const opAcct = await accountService.getOperatorReceivableAccount(
          refund.booking.companyId,
        );
        engine.addCredit({
          accountId: opAcct.id,
          amount: operatorNet,
          sequenceNumber: seq++,
          referenceType: "REFUND",
          referenceId: refund.id,
          description: "Restore operator receivable on refund void",
        });
      }

      if (commission > 0) {
        const platformCommissionAcct =
          await accountService.getPlatformCommissionRevenueAccount();
        engine.addCredit({
          accountId: platformCommissionAcct.id,
          amount: commission,
          sequenceNumber: seq++,
          referenceType: "REFUND",
          referenceId: refund.id,
          description: "Restore platform commission on refund void",
        });
      }

      engine.validate();
      await engine.commit(tx as any);
    }

    return updated;
  });
}
