import {
  adminCreateCampaignSchema,
  bulkCreateCouponsSchema,
  createCouponSchema,
  deactivateCouponSchema,
  issuePromoCreditSchema,
  listCampaignsSchema,
  listCouponsSchema,
  listRedemptionsSchema,
  listScopeSchedulesSchema,
  listScopeTripsSchema,
  listUserCreditLotsSchema,
  notifyOptedInCampaignSchema,
  setCampaignStatusSchema,
  updateCampaignSchema,
  updateReferralProgramSchema,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createCampaign } from "@/features/discounts/services/campaign-crud";
import {
  grantAdminCreditLot,
  listCreditLotsForUser,
} from "@/features/discounts/services/credit-grant-service";
import {
  listSchedulesForScope,
  listTripsForScope,
} from "@/features/discounts/services/scope-options-service";
import { logMarketingActivity } from "@/features/discounts/services/marketing-audit";
import { omitUndefined } from "@/features/discounts/lib/omit-undefined";
import { requireAdminPermission } from "@/lib/permissions/admin-authorize";
import { adminProcedure, createTRPCRouter } from "../init";

function summarizeAbuseEvent(
  eventType: string,
  meta: Record<string, unknown> | null,
): string {
  const code =
    typeof meta?.["code"] === "string" ? (meta["code"] as string) : null;
  switch (eventType) {
    case "SELF_REFERRAL":
      return code ? `Self-referral blocked (${code})` : "Self-referral blocked";
    case "SAME_PHONE_REFERRAL":
      return "Same phone as referrer";
    case "SAME_DEVICE_REFERRAL":
      return "Same device as referrer";
    case "VELOCITY_CAP":
      return "Referrer daily qualification cap hit";
    default:
      return eventType.replaceAll("_", " ").toLowerCase();
  }
}

export const discountsAdminRouter = createTRPCRouter({
  listCampaigns: adminProcedure
    .input(listCampaignsSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:read");
      const where = {
        ownerType: "PLATFORM" as const,
        ...(input.status ? { status: input.status } : {}),
        ...(input.search
          ? { name: { contains: input.search, mode: "insensitive" as const } }
          : {}),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.discountCampaign.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            _count: { select: { coupons: true, redemptions: true } },
          },
        }),
        ctx.prisma.discountCampaign.count({ where }),
      ]);
      return { items, total };
    }),

  getCampaign: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:read");
      const campaign = await ctx.prisma.discountCampaign.findUnique({
        where: { id: input.id },
        include: {
          routeScopes: true,
          scheduleScopes: true,
          tripScopes: true,
          coupons: { take: 50, orderBy: { createdAt: "desc" } },
          companyOptIns: true,
        },
      });
      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      return campaign;
    }),

  listScopeSchedules: adminProcedure
    .input(listScopeSchedulesSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:read");
      return listSchedulesForScope(ctx.prisma, {
        routeIds: input.routeIds,
        companyId: input.companyId,
        limit: input.limit,
      });
    }),

  listScopeTrips: adminProcedure
    .input(listScopeTripsSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:read");
      return listTripsForScope(ctx.prisma, {
        scheduleIds: input.scheduleIds,
        routeIds: input.routeIds,
        companyId: input.companyId,
        daysAhead: input.daysAhead,
        limit: input.limit,
      });
    }),

  createCampaign: adminProcedure
    .input(adminCreateCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:write");
      const campaign = await createCampaign(ctx.prisma, input, {
        ownerType: "PLATFORM",
        companyId: null,
        createdByUserId: ctx.user.id,
      });
      await logMarketingActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "MARKETING_CAMPAIGN_CREATE",
        description: `Created platform campaign "${campaign.name}" (${campaign.id})`,
        metadata: { campaignId: campaign.id, status: campaign.status },
      });
      return campaign;
    }),

  updateCampaign: adminProcedure
    .input(updateCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:write");
      const { id, scopes, ...data } = input;
      const existing = await ctx.prisma.discountCampaign.findUnique({
        where: { id },
      });
      if (!existing || existing.ownerType !== "PLATFORM") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      return ctx.prisma.$transaction(async (tx) => {
        await tx.discountCampaign.update({
          where: { id },
          data: omitUndefined(data as Record<string, unknown>),
        });
        if (scopes) {
          const { replaceCampaignScopes } = await import(
            "@/features/discounts/services/campaign-crud"
          );
          await replaceCampaignScopes(tx, id, scopes);
        }
        return tx.discountCampaign.findUniqueOrThrow({ where: { id } });
      });
    }),

  setCampaignStatus: adminProcedure
    .input(setCampaignStatusSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:write");
      const before = await ctx.prisma.discountCampaign.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          companyId: true,
          ownerType: true,
          status: true,
        },
      });
      if (!before) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }
      // P1-15: platform admin may manage any campaign; existence + audit is the guard.
      const updated = await ctx.prisma.discountCampaign.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.status === "PAUSED"
            ? {
                pausedByAdminAt: new Date(),
                pauseReason: input.pauseReason ?? null,
              }
            : {}),
        },
      });

      if (
        input.status === "PAUSED" &&
        before?.ownerType === "OPERATOR" &&
        before.companyId
      ) {
        const owners = await ctx.prisma.operator.findMany({
          where: {
            companyId: before.companyId,
            role: { in: ["OWNER", "ADMIN", "MANAGER"] },
            isActive: true,
            deletedAt: null,
          },
          include: {
            user: { select: { id: true, email: true, fullName: true } },
          },
        });
        if (owners.length > 0) {
          const { notifyOperatorCampaignPaused } = await import(
            "@/features/discounts/services/notify"
          );
          notifyOperatorCampaignPaused({
            operatorUsers: owners.map((m) => ({
              userId: m.user.id,
              email: m.user.email,
              fullName: m.user.fullName,
            })),
            campaignId: before.id,
            campaignName: before.name,
            reason: input.pauseReason ?? "Campaign paused by administrator",
          });
        }
      }

      await logMarketingActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "MARKETING_CAMPAIGN_STATUS",
        description: `Set campaign "${before?.name ?? input.id}" status to ${input.status}`,
        metadata: {
          campaignId: input.id,
          from: before?.status,
          to: input.status,
          pauseReason: input.pauseReason ?? null,
        },
      });

      return updated;
    }),

  listCoupons: adminProcedure
    .input(listCouponsSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:read");
      const where = {
        ...(input.campaignId ? { campaignId: input.campaignId } : {}),
        ...(input.search
          ? { code: { contains: input.search.toUpperCase() } }
          : {}),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.couponCode.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: { campaign: { select: { name: true } } },
        }),
        ctx.prisma.couponCode.count({ where }),
      ]);
      return { items, total };
    }),

  createCoupon: adminProcedure
    .input(createCouponSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:coupons:write");
      const coupon = await ctx.prisma.couponCode.create({
        data: omitUndefined(input as Record<string, unknown>) as {
          campaignId: string;
          code: string;
        },
      });
      await logMarketingActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "MARKETING_COUPON_CREATE",
        description: `Created coupon ${coupon.code} for campaign ${coupon.campaignId}`,
        metadata: { couponId: coupon.id, campaignId: coupon.campaignId },
      });
      return coupon;
    }),

  bulkCreateCoupons: adminProcedure
    .input(bulkCreateCouponsSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:coupons:write");
      const { bulkCreateCouponCodes } = await import(
        "@/features/discounts/services/bulk-coupon-create"
      );
      const result = await bulkCreateCouponCodes(ctx.prisma, {
        campaignId: input.campaignId,
        prefix: input.prefix,
        count: input.count,
        maxRedemptions: input.maxRedemptions,
        expiresAt: input.expiresAt,
      });
      await logMarketingActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "MARKETING_COUPON_BULK",
        description: `Bulk created ${result.codes.length} coupons (batch ${result.batchId})`,
        metadata: {
          campaignId: input.campaignId,
          batchId: result.batchId,
          created: result.codes.length,
          failed: result.failed.length,
        },
      });
      return result;
    }),

  deactivateCoupon: adminProcedure
    .input(deactivateCouponSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:coupons:write");
      return ctx.prisma.couponCode.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  notifyOptedInCampaign: adminProcedure
    .input(notifyOptedInCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:write");
      const campaign = await ctx.prisma.discountCampaign.findUnique({
        where: { id: input.campaignId },
      });
      if (!campaign || campaign.ownerType !== "PLATFORM") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform campaign not found",
        });
      }
      const benefitSummary =
        campaign.benefitType === "PERCENT_OFF"
          ? `${(campaign.percentBps ?? 0) / 100}% off ticket fare`
          : campaign.benefitType === "FIXED_AMOUNT_OFF"
            ? `${campaign.amountXOF?.toLocaleString() ?? 0} XOF off`
            : campaign.benefitType;
      const { notifyOptedInCampaignStarting } = await import(
        "@/features/discounts/services/marketing-blast"
      );
      const result = await notifyOptedInCampaignStarting(ctx.prisma, {
        campaignId: campaign.id,
        campaignName: campaign.name,
        benefitSummary,
        ...(input.limit !== undefined ? { limit: input.limit } : {}),
      });
      await logMarketingActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "MARKETING_CAMPAIGN_NOTIFY_OPT_IN",
        description: `Notified opted-in passengers for campaign ${campaign.name}`,
        metadata: {
          campaignId: campaign.id,
          attempted: result.attempted,
          skippedNoNovu: result.skippedNoNovu,
        },
      });
      return result;
    }),



  grantCredit: adminProcedure
    .input(issuePromoCreditSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:credits:issue");
      const lot = await grantAdminCreditLot(ctx.prisma, {
        userId: input.userId,
        amountXOF: input.amountXOF,
        source: input.source,
        reason: input.reason,
        expiresAt: input.expiresAt,
        idempotencyKey: input.idempotencyKey,
        issuedByAdminId: ctx.user.id,
      });
      await logMarketingActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "MARKETING_CREDIT_GRANT",
        description: `Granted ${input.amountXOF} XOF promo credits (${input.source}) to user ${input.userId}`,
        targetUserId: input.userId,
        metadata: { creditLotId: lot.id, amountXOF: input.amountXOF, source: input.source },
      });
      return lot;
    }),

  grantPromoCredits: adminProcedure
    .input(issuePromoCreditSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:credits:issue");
      const lot = await grantAdminCreditLot(ctx.prisma, {
        userId: input.userId,
        amountXOF: input.amountXOF,
        source: input.source,
        reason: input.reason,
        expiresAt: input.expiresAt,
        idempotencyKey: input.idempotencyKey,
        issuedByAdminId: ctx.user.id,
      });
      await logMarketingActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "MARKETING_CREDIT_GRANT",
        description: `Granted ${input.amountXOF} XOF promo credits (${input.source}) to user ${input.userId}`,
        targetUserId: input.userId,
        metadata: { creditLotId: lot.id, amountXOF: input.amountXOF, source: input.source },
      });
      return lot;
    }),

  listUserCredits: adminProcedure
    .input(listUserCreditLotsSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:read");
      return listCreditLotsForUser(ctx.prisma, input.userId, input.limit);
    }),

  getReferralProgram: adminProcedure.query(async ({ ctx }) => {
    requireAdminPermission(ctx, "marketing:referrals:write");
    return (
      (await ctx.prisma.referralProgram.findUnique({ where: { id: "default" } })) ??
      (await ctx.prisma.referralProgram.create({
        data: { id: "default", isActive: false },
      }))
    );
  }),

  updateReferralProgram: adminProcedure
    .input(updateReferralProgramSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:referrals:write");
      await ctx.prisma.referralProgram.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          ...omitUndefined(input as Record<string, unknown>),
        },
        update: omitUndefined(input as Record<string, unknown>),
      });
      await logMarketingActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "MARKETING_REFERRAL_PROGRAM_UPDATE",
        description: "Updated default referral program settings",
        metadata: input as unknown as import("@moja/db").Prisma.InputJsonValue,
      });
      return ctx.prisma.referralProgram.findUniqueOrThrow({
        where: { id: "default" },
      });
    }),

  listAbuseEvents: adminProcedure
    .input(
      z.object({
        eventType: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:fraud:review");
      const where = {
        ...(input.eventType ? { eventType: input.eventType } : {}),
      };
      const [rows, total] = await Promise.all([
        ctx.prisma.promoAbuseEvent.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.promoAbuseEvent.count({ where }),
      ]);

      const userIds = [
        ...new Set(rows.map((r) => r.userId).filter(Boolean) as string[]),
      ];
      const campaignIds = [
        ...new Set(rows.map((r) => r.campaignId).filter(Boolean) as string[]),
      ];
      const [users, campaigns] = await Promise.all([
        userIds.length
          ? ctx.prisma.user.findMany({
              where: { id: { in: userIds } },
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            })
          : Promise.resolve([]),
        campaignIds.length
          ? ctx.prisma.discountCampaign.findMany({
              where: { id: { in: campaignIds } },
              select: { id: true, name: true, status: true },
            })
          : Promise.resolve([]),
      ]);
      const userById = new Map(users.map((u) => [u.id, u]));
      const campaignById = new Map(campaigns.map((c) => [c.id, c]));

      return {
        total,
        items: rows.map((row) => {
          const meta =
            row.metadata && typeof row.metadata === "object"
              ? (row.metadata as Record<string, unknown>)
              : null;
          const user = row.userId ? userById.get(row.userId) : undefined;
          const campaign = row.campaignId
            ? campaignById.get(row.campaignId)
            : undefined;
          return {
            id: row.id,
            eventType: row.eventType,
            userId: row.userId,
            campaignId: row.campaignId,
            createdAt: row.createdAt,
            reviewed: Boolean(meta?.["reviewedAt"]),
            summary: summarizeAbuseEvent(row.eventType, meta),
            user: user
              ? {
                  id: user.id,
                  fullName: user.fullName,
                  email: user.email,
                  role: user.role,
                }
              : null,
            campaign: campaign
              ? {
                  id: campaign.id,
                  name: campaign.name,
                  status: campaign.status,
                }
              : null,
          };
        }),
      };
    }),

  resolveAbuseEvent: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        note: z.string().max(500).optional(),
        reviewStatus: z
          .enum(["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"])
          .optional()
          .default("RESOLVED"),
        assigneeUserId: z.string().min(1).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:fraud:review");
      const existing = await ctx.prisma.promoAbuseEvent.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Abuse event not found" });
      }
      const prev =
        existing.metadata && typeof existing.metadata === "object"
          ? (existing.metadata as Record<string, unknown>)
          : {};
      const terminal =
        input.reviewStatus === "RESOLVED" || input.reviewStatus === "DISMISSED";
      const updated = await ctx.prisma.promoAbuseEvent.update({
        where: { id: input.id },
        data: {
          reviewStatus: input.reviewStatus,
          ...(input.assigneeUserId !== undefined
            ? { assigneeUserId: input.assigneeUserId }
            : {}),
          resolutionNote: input.note ?? existing.resolutionNote,
          ...(terminal
            ? {
                resolvedAt: new Date(),
                resolvedByUserId: ctx.user.id,
              }
            : {}),
          metadata: {
            ...prev,
            reviewedAt: new Date().toISOString(),
            reviewedByUserId: ctx.user.id,
            reviewNote: input.note ?? null,
          },
        },
      });
      await logMarketingActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "MARKETING_ABUSE_REVIEW",
        description: `Reviewed promo abuse event ${input.id} (${existing.eventType}) → ${input.reviewStatus}`,
        targetUserId: existing.userId ?? undefined,
        metadata: {
          abuseEventId: input.id,
          eventType: existing.eventType,
          reviewStatus: input.reviewStatus,
        },
      });
      return updated;
    }),

  listRedemptions: adminProcedure
    .input(listRedemptionsSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:read");
      const { listDiscountRedemptions } = await import(
        "@/features/discounts/services/redemption-list"
      );
      return listDiscountRedemptions(ctx.prisma, {
        campaignId: input.campaignId,
        couponCodeId: input.couponCodeId,
        status: input.status,
        limit: input.limit,
        offset: input.offset,
        privacy: false,
      });
    }),

  marketingSummary: adminProcedure.query(async ({ ctx }) => {
    requireAdminPermission(ctx, "marketing:campaigns:read");

    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const d365 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const openCreditWhere = {
      status: { in: ["ACTIVE" as const, "PARTIALLY_REDEEMED" as const] },
      remainingXOF: { gt: 0 },
    };

    const [
      activeCampaigns,
      redemptionAgg,
      referralEdges,
      abuseEvents,
      creditOutstanding,
      aging0to30,
      aging30to90,
      aging90to365,
      aging365plus,
    ] = await Promise.all([
      ctx.prisma.discountCampaign.count({
        where: { status: "ACTIVE", ownerType: "PLATFORM" },
      }),
      ctx.prisma.discountRedemption.aggregate({
        where: { status: "FINALIZED" },
        _count: true,
        _sum: {
          ticketDiscountXOF: true,
          platformFundedXOF: true,
          operatorFundedXOF: true,
          creditAppliedXOF: true,
        },
      }),
      ctx.prisma.referralEdge.groupBy({
        by: ["status"],
        _count: true,
      }),
      ctx.prisma.promoAbuseEvent.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      ctx.prisma.creditLot.aggregate({
        where: openCreditWhere,
        _sum: { remainingXOF: true },
        _count: true,
      }),
      ctx.prisma.creditLot.aggregate({
        where: { ...openCreditWhere, createdAt: { gte: d30 } },
        _sum: { remainingXOF: true },
        _count: true,
      }),
      ctx.prisma.creditLot.aggregate({
        where: {
          ...openCreditWhere,
          createdAt: { gte: d90, lt: d30 },
        },
        _sum: { remainingXOF: true },
        _count: true,
      }),
      ctx.prisma.creditLot.aggregate({
        where: {
          ...openCreditWhere,
          createdAt: { gte: d365, lt: d90 },
        },
        _sum: { remainingXOF: true },
        _count: true,
      }),
      ctx.prisma.creditLot.aggregate({
        where: {
          ...openCreditWhere,
          createdAt: { lt: d365 },
        },
        _sum: { remainingXOF: true },
        _count: true,
      }),
    ]);

    const referralFunnel = Object.fromEntries(
      referralEdges.map((row) => [row.status, row._count]),
    );

    return {
      activeCampaigns,
      confirmedRedemptions: redemptionAgg._count,
      ticketDiscountXOF: redemptionAgg._sum.ticketDiscountXOF ?? 0,
      platformExpenseXOF: redemptionAgg._sum.platformFundedXOF ?? 0,
      operatorFundedXOF: redemptionAgg._sum.operatorFundedXOF ?? 0,
      creditsAppliedXOF: redemptionAgg._sum.creditAppliedXOF ?? 0,
      creditLiabilityXOF: creditOutstanding._sum.remainingXOF ?? 0,
      openCreditLots: creditOutstanding._count,
      creditOutstandingXOF: creditOutstanding._sum.remainingXOF ?? 0,
      referralFunnel,
      abuseEventsLast7d: abuseEvents,
      creditAging: {
        d0to30: {
          count: aging0to30._count,
          remainingXOF: aging0to30._sum.remainingXOF ?? 0,
        },
        d30to90: {
          count: aging30to90._count,
          remainingXOF: aging30to90._sum.remainingXOF ?? 0,
        },
        d90to365: {
          count: aging90to365._count,
          remainingXOF: aging90to365._sum.remainingXOF ?? 0,
        },
        d365plus: {
          count: aging365plus._count,
          remainingXOF: aging365plus._sum.remainingXOF ?? 0,
        },
      },
    };
  }),

  campaignPerformance: adminProcedure
    .input(z.object({ campaignId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:read");
      const campaign = await ctx.prisma.discountCampaign.findUnique({
        where: { id: input.campaignId },
        select: {
          id: true,
          name: true,
          status: true,
          fundingType: true,
          budgetXOF: true,
          budgetReservedXOF: true,
          budgetConsumedXOF: true,
          ownerType: true,
        },
      });
      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }

      const [agg, byStatus, topRoutes] = await Promise.all([
        ctx.prisma.discountRedemption.aggregate({
          where: { campaignId: input.campaignId, status: "FINALIZED" },
          _count: true,
          _sum: {
            ticketDiscountXOF: true,
            platformFundedXOF: true,
            operatorFundedXOF: true,
            creditAppliedXOF: true,
          },
        }),
        ctx.prisma.discountRedemption.groupBy({
          by: ["status"],
          where: { campaignId: input.campaignId },
          _count: true,
        }),
        ctx.prisma.discountRedemption.groupBy({
          by: ["companyId"],
          where: {
            campaignId: input.campaignId,
            status: "FINALIZED",
            companyId: { not: null },
          },
          _count: true,
          _sum: { ticketDiscountXOF: true },
          orderBy: { _count: { companyId: "desc" } },
          take: 10,
        }),
      ]);

      return {
        campaign,
        confirmedRedemptions: agg._count,
        ticketDiscountXOF: agg._sum.ticketDiscountXOF ?? 0,
        platformFundedXOF: agg._sum.platformFundedXOF ?? 0,
        operatorFundedXOF: agg._sum.operatorFundedXOF ?? 0,
        creditAppliedXOF: agg._sum.creditAppliedXOF ?? 0,
        byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
        byCompany: topRoutes.map((r) => ({
          companyId: r.companyId!,
          redemptions: r._count,
          ticketDiscountXOF: r._sum.ticketDiscountXOF ?? 0,
        })),
      };
    }),

  exportRedemptionsCsv: adminProcedure
    .input(
      z.object({
        campaignId: z.string().optional(),
        limit: z.number().int().min(1).max(5000).default(1000),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketing:campaigns:read");
      const rows = await ctx.prisma.discountRedemption.findMany({
        where: {
          status: "FINALIZED",
          ...(input.campaignId ? { campaignId: input.campaignId } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          createdAt: true,
          campaignId: true,
          companyId: true,
          ticketDiscountXOF: true,
          platformFundedXOF: true,
          operatorFundedXOF: true,
          creditAppliedXOF: true,
          fundingType: true,
          instrumentType: true,
          holdGroupId: true,
        },
      });

      const header = [
        "id",
        "createdAt",
        "campaignId",
        "companyId",
        "instrumentType",
        "fundingType",
        "ticketDiscountXOF",
        "platformFundedXOF",
        "operatorFundedXOF",
        "creditAppliedXOF",
        "holdGroupId",
      ].join(",");

      const lines = rows.map((r) =>
        [
          r.id,
          r.createdAt.toISOString(),
          r.campaignId ?? "",
          r.companyId ?? "",
          r.instrumentType,
          r.fundingType ?? "",
          r.ticketDiscountXOF,
          r.platformFundedXOF,
          r.operatorFundedXOF,
          r.creditAppliedXOF,
          r.holdGroupId ?? "",
        ].join(","),
      );

      return {
        filename: `promo-redemptions-${new Date().toISOString().slice(0, 10)}.csv`,
        csv: [header, ...lines].join("\n"),
        rowCount: rows.length,
      };
    }),
});
