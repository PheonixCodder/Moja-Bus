import type { Prisma, PrismaClient } from "@moja/db";
import type { UpsertCampaignBase } from "@moja/schemas";

type ScopeInput = {
  routeIds?: string[] | undefined;
  scheduleIds?: string[] | undefined;
  tripIds?: string[] | undefined;
};

export async function replaceCampaignScopes(
  tx: Prisma.TransactionClient,
  campaignId: string,
  scopes?: ScopeInput,
) {
  await tx.campaignRouteScope.deleteMany({ where: { campaignId } });
  await tx.campaignScheduleScope.deleteMany({ where: { campaignId } });
  await tx.campaignTripScope.deleteMany({ where: { campaignId } });

  if (scopes?.routeIds?.length) {
    await tx.campaignRouteScope.createMany({
      data: scopes.routeIds.map((routeId) => ({ campaignId, routeId })),
      skipDuplicates: true,
    });
  }
  if (scopes?.scheduleIds?.length) {
    await tx.campaignScheduleScope.createMany({
      data: scopes.scheduleIds.map((scheduleId) => ({
        campaignId,
        scheduleId,
      })),
      skipDuplicates: true,
    });
  }
  if (scopes?.tripIds?.length) {
    await tx.campaignTripScope.createMany({
      data: scopes.tripIds.map((tripId) => ({ campaignId, tripId })),
      skipDuplicates: true,
    });
  }
}

export function campaignCreateData(
  input: UpsertCampaignBase,
  extra: {
    ownerType: "PLATFORM" | "OPERATOR";
    companyId: string | null;
    createdByUserId: string | null;
    fundingType?: "PLATFORM" | "OPERATOR" | "HYBRID";
  },
) {
  return {
    ownerType: extra.ownerType,
    companyId: extra.companyId,
    name: input.name,
    description: input.description ?? null,
    status: input.status ?? "DRAFT",
    fundingType: extra.fundingType ?? input.fundingType,
    platformShareBps: input.platformShareBps,
    operatorShareBps: input.operatorShareBps,
    benefitType: input.benefitType,
    percentBps: input.percentBps ?? null,
    amountXOF: input.amountXOF ?? null,
    freeSeatCount: input.freeSeatCount ?? null,
    applyTarget: input.applyTarget,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    minSubtotalXOF: input.minSubtotalXOF ?? null,
    minSeatCount: input.minSeatCount ?? null,
    maxSeatCount: input.maxSeatCount ?? null,
    firstBookingOnly: input.firstBookingOnly,
    newUserOnly: input.newUserOnly,
    maxRedemptionsGlobal: input.maxRedemptionsGlobal ?? null,
    maxRedemptionsPerUser: input.maxRedemptionsPerUser ?? null,
    maxRedemptionsPerPhone: input.maxRedemptionsPerPhone ?? null,
    maxDiscountPerBookingXOF: input.maxDiscountPerBookingXOF ?? null,
    budgetXOF: input.budgetXOF ?? null,
    stackGroup: input.stackGroup,
    priority: input.priority,
    isAutoApply: input.isAutoApply,
    allowCombineWithCredit: input.allowCombineWithCredit,
    requireOperatorOptIn: input.requireOperatorOptIn,
    createdByUserId: extra.createdByUserId,
  };
}

export async function createCampaign(
  prisma: PrismaClient,
  input: UpsertCampaignBase,
  extra: {
    ownerType: "PLATFORM" | "OPERATOR";
    companyId: string | null;
    createdByUserId: string | null;
    fundingType?: "PLATFORM" | "OPERATOR" | "HYBRID";
  },
) {
  return prisma.$transaction(async (tx) => {
    const campaign = await tx.discountCampaign.create({
      data: campaignCreateData(input, extra),
    });
    await replaceCampaignScopes(tx, campaign.id, input.scopes);
    return tx.discountCampaign.findUniqueOrThrow({
      where: { id: campaign.id },
      include: {
        routeScopes: true,
        scheduleScopes: true,
        tripScopes: true,
        coupons: true,
      },
    });
  });
}
