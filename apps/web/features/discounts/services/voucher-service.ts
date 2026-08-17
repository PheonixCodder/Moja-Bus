import type { Prisma, PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import {
  isPromotionalVoucherSource,
  PROMOTIONAL_VOUCHER_SOURCES,
} from "../lib/promo-ceilings";
import { getPromoPolicy } from "../lib/promo-policy";

type VoucherDb = PrismaClient | Prisma.TransactionClient;

export async function createCancellationVoucherRecord(
  prisma: VoucherDb,
  input: {
    userId: string;
    amountXOF: number;
    sourceBookingId?: string;
    sourceHoldGroupId?: string;
    scheduleId: string;
    companyId: string;
  },
): Promise<{ voucherId: string; expiresAt: Date } | null> {
  if (input.amountXOF <= 0) return null;
  if (!input.scheduleId || !input.companyId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Cancellation vouchers require a schedule — use wallet or cash refund instead",
    });
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 12);

  if (input.sourceBookingId) {
    const existing = await prisma.monetaryVoucher.findFirst({
      where: {
        source: "CANCELLATION",
        sourceBookingId: input.sourceBookingId,
        userId: input.userId,
      },
      select: { id: true, expiresAt: true },
    });
    if (existing) {
      return { voucherId: existing.id, expiresAt: existing.expiresAt ?? expiresAt };
    }
  }

  const voucher = await prisma.monetaryVoucher.create({
    data: {
      userId: input.userId,
      source: "CANCELLATION",
      status: "ACTIVE",
      originalAmountXOF: input.amountXOF,
      remainingAmountXOF: input.amountXOF,
      expiresAt,
      scheduleId: input.scheduleId,
      companyId: input.companyId,
      sourceBookingId: input.sourceBookingId ?? null,
      sourceHoldGroupId: input.sourceHoldGroupId ?? null,
    },
  });

  return { voucherId: voucher.id, expiresAt };
}

export async function issueCancellationVoucher(
  prisma: PrismaClient,
  input: {
    userId: string;
    amountXOF: number;
    sourceBookingId?: string;
    sourceHoldGroupId?: string;
    scheduleId: string;
    companyId: string;
  },
): Promise<{ voucherId: string } | null> {
  const issued = await createCancellationVoucherRecord(prisma, input);
  if (!issued) return null;

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
      voucherId: issued.voucherId,
      source: "CANCELLATION",
      expiresAt: issued.expiresAt,
    });
  }

  return { voucherId: issued.voucherId };
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
    include: {
      schedule: {
        select: {
          id: true,
          name: true,
          departureTime: true,
          route: {
            select: {
              name: true,
              originTerminal: {
                select: { cityRelation: { select: { name: true } } },
              },
              destTerminal: {
                select: { cityRelation: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
