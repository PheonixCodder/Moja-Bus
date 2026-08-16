import type { PrismaClient, Prisma } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type { ResolvedHoldGroup } from "./resolve-hold-group";

export type SettlementKind = "PAYSTACK" | "WALLET" | "ZERO_CASH" | "MIXED";

export type BookingSettlement = {
  kind: SettlementKind;
  /** Present when a SUCCESS Paystack (or other) ExternalPayment exists. */
  externalPaymentId: string | null;
  /** True when cancel/refund is allowed for this hold. */
  cancellable: boolean;
};

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Resolve how a confirmed hold was settled so cancel does not require
 * ExternalPayment SUCCESS (wallet / zero-cash confirms never create one).
 */
export async function resolveBookingSettlement(
  prisma: DbClient,
  holdGroup: ResolvedHoldGroup,
): Promise<BookingSettlement> {
  const payment = holdGroup.payment;
  if (payment?.status === "SUCCESS") {
    const walletLeg = await prisma.ledgerEntry.findFirst({
      where: {
        idempotencyKey: { startsWith: `WALLET_PAYMENT_${holdGroup.id}` },
      },
      select: { id: true },
    });
    return {
      kind: walletLeg ? "MIXED" : "PAYSTACK",
      externalPaymentId: payment.id,
      cancellable: true,
    };
  }

  const walletLeg = await prisma.ledgerEntry.findFirst({
    where: {
      idempotencyKey: { startsWith: `WALLET_PAYMENT_${holdGroup.id}` },
    },
    select: { id: true },
  });

  if (walletLeg) {
    return {
      kind: "WALLET",
      externalPaymentId: null,
      cancellable: true,
    };
  }

  const snapshot = holdGroup.pricingSnapshot;
  const charge = snapshot?.chargeAmountXOF ?? null;
  const allConfirmed = holdGroup.bookings.every(
    (b) => b.status === "CONFIRMED" || b.status === "CANCELLED" || b.status === "REFUND_PENDING",
  );
  const hasConfirmed = holdGroup.bookings.some((b) => b.status === "CONFIRMED");

  if (
    hasConfirmed &&
    allConfirmed &&
    charge === 0 &&
    holdGroup.status !== "ACTIVE"
  ) {
    return {
      kind: "ZERO_CASH",
      externalPaymentId: null,
      cancellable: true,
    };
  }

  // Confirmed seats with no payment row and no wallet ledger — treat as
  // zero-cash / promo-only if any booking is CONFIRMED (legacy wallet confirms).
  if (hasConfirmed && !payment) {
    return {
      kind: charge === 0 ? "ZERO_CASH" : "WALLET",
      externalPaymentId: null,
      cancellable: true,
    };
  }

  return {
    kind: "PAYSTACK",
    externalPaymentId: payment?.id ?? null,
    cancellable: false,
  };
}

export function assertSettlementCancellable(settlement: BookingSettlement): void {
  if (!settlement.cancellable) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No successful settlement found for this booking",
    });
  }
}
