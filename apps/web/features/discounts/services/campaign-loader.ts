import type { PrismaClient } from "@moja/db";
import type { EvalCampaign, EvalCoupon, EvalCreditLot, EvalVoucher } from "../engine/types";

/** Caps: FINALIZED only (used). Budget still tracks reserved separately (P1-19 / Phase 04). */
const FINALIZED_ONLY = { status: "FINALIZED" as const };

type CampaignRow = Awaited<
  ReturnType<
    PrismaClient["discountCampaign"]["findMany"]
  >
>[number] & {
  routeScopes?: Array<{ routeId: string }>;
  scheduleScopes?: Array<{ scheduleId: string }>;
  tripScopes?: Array<{ tripId: string }>;
  companyOptIns?: Array<{ companyId: string; status: string }>;
  _count?: { redemptions: number };
};

export function mapCampaignToEval(
  row: CampaignRow,
  counts: {
    redemptionCountForUser?: number;
    redemptionCountForPhone?: number;
  } = {},
): EvalCampaign {
  return {
    id: row.id,
    companyId: row.companyId,
    status: row.status,
    fundingType: row.fundingType,
    platformShareBps: row.platformShareBps,
    operatorShareBps: row.operatorShareBps,
    benefitType: row.benefitType,
    percentBps: row.percentBps,
    amountXOF: row.amountXOF,
    freeSeatCount: row.freeSeatCount,
    applyTarget: row.applyTarget,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    minSubtotalXOF: row.minSubtotalXOF,
    minSeatCount: row.minSeatCount,
    maxSeatCount: row.maxSeatCount,
    firstBookingOnly: row.firstBookingOnly,
    newUserOnly: row.newUserOnly,
    maxRedemptionsGlobal: row.maxRedemptionsGlobal,
    maxRedemptionsPerUser: row.maxRedemptionsPerUser,
    maxRedemptionsPerPhone: row.maxRedemptionsPerPhone,
    maxDiscountPerBookingXOF: row.maxDiscountPerBookingXOF,
    budgetXOF: row.budgetXOF,
    budgetConsumedXOF: row.budgetConsumedXOF,
    budgetReservedXOF: row.budgetReservedXOF,
    stackGroup: row.stackGroup,
    priority: row.priority,
    isAutoApply: row.isAutoApply,
    allowCombineWithCredit: row.allowCombineWithCredit,
    requireOperatorOptIn: row.requireOperatorOptIn,
    redemptionCountGlobal: row._count?.redemptions,
    redemptionCountForUser: counts.redemptionCountForUser ?? 0,
    redemptionCountForPhone: counts.redemptionCountForPhone ?? 0,
    routeIds: row.routeScopes?.map((s) => s.routeId),
    scheduleIds: row.scheduleScopes?.map((s) => s.scheduleId),
    tripIds: row.tripScopes?.map((s) => s.tripId),
    optedInCompanyIds: row.companyOptIns
      ?.filter((o) => o.status === "OPTED_IN")
      .map((o) => o.companyId),
  };
}

export async function loadActiveCampaignsForCheckout(
  prisma: PrismaClient,
  input: {
    companyId: string;
    userId: string | null;
    phone?: string | null;
    now?: Date;
  },
): Promise<EvalCampaign[]> {
  const now = input.now ?? new Date();
  const rows = await prisma.discountCampaign.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { companyId: null },
        { companyId: input.companyId },
      ],
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: {
      routeScopes: true,
      scheduleScopes: true,
      tripScopes: true,
      companyOptIns: {
        where: { companyId: input.companyId },
      },
      _count: {
        select: {
          redemptions: { where: FINALIZED_ONLY },
        },
      },
    },
  });

  const result: EvalCampaign[] = [];
  for (const row of rows) {
    let redemptionCountForUser = 0;
    let redemptionCountForPhone = 0;
    if (input.userId && row.maxRedemptionsPerUser != null) {
      redemptionCountForUser = await prisma.discountRedemption.count({
        where: {
          userId: input.userId,
          campaignId: row.id,
          ...FINALIZED_ONLY,
        },
      });
    }
    if (input.phone && row.maxRedemptionsPerPhone != null) {
      redemptionCountForPhone = await prisma.discountRedemption.count({
        where: {
          campaignId: row.id,
          ...FINALIZED_ONLY,
          user: { phoneNumber: input.phone },
        },
      });
    }
    result.push(
      mapCampaignToEval(row, {
        redemptionCountForUser,
        redemptionCountForPhone,
      }),
    );
  }
  return result;
}

export async function loadCouponByCode(
  prisma: PrismaClient,
  code: string,
): Promise<EvalCoupon | null> {
  const row = await prisma.couponCode.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!row) return null;
  return {
    id: row.id,
    campaignId: row.campaignId,
    code: row.code,
    isActive: row.isActive,
    maxRedemptions: row.maxRedemptions,
    redemptionCount: row.redemptionCount,
    expiresAt: row.expiresAt,
    assignedUserId: row.assignedUserId,
  };
}

export async function loadUserVoucher(
  prisma: PrismaClient,
  userId: string,
  voucherId: string,
): Promise<EvalVoucher | null> {
  const row = await prisma.monetaryVoucher.findFirst({
    where: { id: voucherId, userId },
  });
  if (!row) return null;
  return {
    id: row.id,
    remainingAmountXOF: row.remainingAmountXOF,
    reservedAmountXOF: row.reservedAmountXOF,
    status: row.status,
    expiresAt: row.expiresAt,
    applyTarget: "ENTIRE_CHARGE",
    scheduleId: row.scheduleId,
    companyId: row.companyId,
  };
}

export async function loadUserCreditLots(
  prisma: PrismaClient,
  userId: string,
): Promise<EvalCreditLot[]> {
  const rows = await prisma.creditLot.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "PARTIALLY_REDEEMED"] },
      remainingXOF: { gt: 0 },
    },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    remainingXOF: row.remainingXOF,
    reservedXOF: row.reservedXOF,
    expiresAt: row.expiresAt,
    status: row.status,
  }));
}

export async function countCompletedBookings(
  prisma: PrismaClient,
  userId: string | null,
): Promise<number> {
  if (!userId) return 0;
  return prisma.booking.count({
    where: {
      userId,
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
  });
}
