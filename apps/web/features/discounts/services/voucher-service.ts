import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import {
  isPromotionalVoucherSource,
  PROMOTIONAL_VOUCHER_SOURCES,
} from "../lib/promo-ceilings";
import { getPromoPolicy } from "../lib/promo-policy";

export async function issueCancellationVoucher(
  prisma: PrismaClient,
  input: {
    userId: string;
    amountXOF: number;
    sourceBookingId?: string;
    sourceHoldGroupId?: string;
  },
): Promise<{ voucherId: string } | null> {
  if (input.amountXOF <= 0) return null;

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 12);

  const voucher = await prisma.monetaryVoucher.create({
    data: {
      userId: input.userId,
      source: "CANCELLATION",
      status: "ACTIVE",
      originalAmountXOF: input.amountXOF,
      remainingAmountXOF: input.amountXOF,
      expiresAt,
      sourceBookingId: input.sourceBookingId ?? null,
      sourceHoldGroupId: input.sourceHoldGroupId ?? null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, fullName: true },
  });
  if (user) {
    const { notifyVoucherIssued } = await import("./notify");
    notifyVoucherIssued({
      user: {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      amountXOF: input.amountXOF,
      voucherId: voucher.id,
      source: "CANCELLATION",
      expiresAt,
    });
  }

  return { voucherId: voucher.id };
}

export async function issueAdminVoucher(
  prisma: PrismaClient,
  input: {
    userId: string;
    amountXOF: number;
    issuedByAdminId: string;
    source?: "ADMIN_MANUAL" | "GOODWILL" | "MARKETING_GRANT" | undefined;
    expiresAt?: Date | null | undefined;
    expiresOnFirstCompletedBooking?: boolean | undefined;
    campaignId?: string | null | undefined;
    code?: string | undefined;
  },
) {
  if (input.amountXOF <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Amount must be positive" });
  }

  const source = input.source ?? "ADMIN_MANUAL";
  if (isPromotionalVoucherSource(source)) {
    const policy = await getPromoPolicy(prisma);
    const activePromoCount = await prisma.monetaryVoucher.count({
      where: {
        userId: input.userId,
        source: { in: [...PROMOTIONAL_VOUCHER_SOURCES] },
        status: { in: ["ACTIVE", "PARTIALLY_REDEEMED"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (activePromoCount >= policy.maxPromotionalVouchersPerUser) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Traveler already has ${policy.maxPromotionalVouchersPerUser} active promotional vouchers`,
      });
    }
  }

  const voucher = await prisma.monetaryVoucher.create({
    data: {
      userId: input.userId,
      source,
      status: "ACTIVE",
      originalAmountXOF: input.amountXOF,
      remainingAmountXOF: input.amountXOF,
      expiresAt: input.expiresAt ?? null,
      expiresOnFirstCompletedBooking:
        input.expiresOnFirstCompletedBooking ?? false,
      issuedByAdminId: input.issuedByAdminId,
      campaignId: input.campaignId ?? null,
      code: input.code ?? null,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, fullName: true },
  });
  if (user) {
    const { notifyVoucherIssued } = await import("./notify");
    notifyVoucherIssued({
      user: {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      amountXOF: input.amountXOF,
      voucherId: voucher.id,
      source,
      expiresAt: input.expiresAt ?? null,
    });
  }
  return voucher;
}

export async function listUserVouchers(
  prisma: PrismaClient,
  userId: string,
  includeExpired = false,
) {
  return prisma.monetaryVoucher.findMany({
    where: {
      userId,
      ...(includeExpired
        ? {}
        : {
            status: { in: ["ACTIVE", "PARTIALLY_REDEEMED"] },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          }),
    },
    orderBy: { createdAt: "desc" },
  });
}
