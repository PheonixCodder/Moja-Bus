import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";

export type GrantPromoCreditsInput = {
  prisma: PrismaClient;
  adminId: string;
  userId: string;
  amountXOF: number;
  source: "GOODWILL" | "MARKETING_GRANT" | "ADMIN_MANUAL";
  reason: string;
  expiresAt?: Date | null | undefined;
};

/**
 * Grants promo credits to a traveler's account for customer support goodwill,
 * marketing incentives, or administrative adjustments.
 */
export async function grantPromoCredits(input: GrantPromoCreditsInput) {
  const { prisma, adminId, userId, amountXOF, source, reason, expiresAt } =
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

  const lot = await prisma.creditLot.create({
    data: {
      userId,
      amountXOF,
      remainingXOF: amountXOF,
      reservedXOF: 0,
      source: source as any,
      status: "ACTIVE",
      expiresAt: resolvedExpiresAt,
      availableAt: new Date(),
    },
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
