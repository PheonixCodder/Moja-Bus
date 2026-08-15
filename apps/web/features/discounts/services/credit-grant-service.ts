import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";

export async function grantAdminCreditLot(
  prisma: PrismaClient,
  input: {
    userId: string;
    amountXOF: number;
    expiresAt?: Date | null | undefined;
    idempotencyKey?: string | undefined;
    issuedByAdminId: string;
  },
) {
  if (input.amountXOF <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Amount must be positive",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }

  const grantIdempotencyKey =
    input.idempotencyKey?.trim() ||
    `admin-credit:${input.issuedByAdminId}:${input.userId}:${input.amountXOF}:${randomBytes(8).toString("hex")}`;

  const existing = await prisma.creditLot.findUnique({
    where: { grantIdempotencyKey },
  });
  if (existing) return existing;

  return prisma.creditLot.create({
    data: {
      userId: input.userId,
      source: "ADMIN",
      status: "ACTIVE",
      amountXOF: input.amountXOF,
      remainingXOF: input.amountXOF,
      expiresAt: input.expiresAt ?? null,
      grantIdempotencyKey,
    },
  });
}

export async function listCreditLotsForUser(
  prisma: PrismaClient,
  userId: string,
  limit = 50,
) {
  return prisma.creditLot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
