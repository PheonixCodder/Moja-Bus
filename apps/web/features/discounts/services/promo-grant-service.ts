import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { postPromoCreditGrantLedger } from "./promo-credit-grant-ledger";

export type GrantPromoCreditsInput = {
  prisma: PrismaClient;
  adminId: string;
  userId: string;
  amountXOF: number;
  source: "GOODWILL" | "MARKETING_GRANT" | "ADMIN_MANUAL";
  reason: string;
  expiresAt?: Date | null | undefined;
  idempotencyKey?: string | undefined;
};

/**
 * Grants promo credits to a traveler's account for customer support goodwill,
 * marketing incentives, or administrative adjustments.
 * Integrates double-entry ledger commitment atomically.
 */
export async function grantPromoCredits(input: GrantPromoCreditsInput) {
  const { prisma, adminId, userId, amountXOF, source, reason, expiresAt, idempotencyKey } =
    input;

  if (amountXOF <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Credit amount must be greater than 0 XOF",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, phoneNumber: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `User with id ${userId} not found`,
    });
  }

  // Default expiration to 180 days if not explicitly provided
  const resolvedExpiresAt =
    expiresAt ?? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

  const grantIdempotencyKey =
    idempotencyKey?.trim() ||
    `promo-grant:${adminId}:${userId}:${amountXOF}:${Date.now()}`;

  const lot = await prisma.$transaction(async (tx) => {
    const createdLot = await tx.creditLot.create({
      data: {
        userId,
        amountXOF,
        remainingXOF: amountXOF,
        reservedXOF: 0,
        source: source as any,
        status: "ACTIVE",
        expiresAt: resolvedExpiresAt,
        availableAt: new Date(),
        grantIdempotencyKey,
      },
    });

    await postPromoCreditGrantLedger(tx, {
      userId,
      amountXOF,
      idempotencyKey: `LEDGER_${grantIdempotencyKey}`,
      description: reason?.trim() || `Promo credit grant (${source})`,
      referenceType: "CREDIT_LOT",
      referenceId: createdLot.id,
    });

    return createdLot;
  });

  return {
    lotId: lot.id,
    amountXOF: lot.amountXOF,
    source: lot.source,
    expiresAt: lot.expiresAt,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    },
  };
}

