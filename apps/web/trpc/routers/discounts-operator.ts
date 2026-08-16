import {
  bulkCreateCouponsSchema,
  campaignOptInSchema,
  createCouponSchema,
  deactivateCouponSchema,
  listCampaignsSchema,
  listRedemptionsSchema,
  listScopeSchedulesSchema,
  listScopeTripsSchema,
  operatorCreateCampaignSchema,
  setCampaignStatusSchema,
  updateCampaignSchema,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createCampaign } from "@/features/discounts/services/campaign-crud";
import {
  listSchedulesForScope,
  listTripsForScope,
} from "@/features/discounts/services/scope-options-service";
import { omitUndefined } from "@/features/discounts/lib/omit-undefined";
import { requirePermission } from "@/lib/permissions/authorize";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";

export const discountsOperatorRouter = createTRPCRouter({
  listCampaigns: operatorCompanyProcedure
    .input(listCampaignsSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:read");
      const where = {
        companyId: ctx.companyId,
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

  getCampaign: operatorCompanyProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:read");
      const campaign = await ctx.prisma.discountCampaign.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          routeScopes: true,
          scheduleScopes: true,
          tripScopes: true,
          coupons: { take: 50, orderBy: { createdAt: "desc" } },
        },
      });
      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      return campaign;
    }),

  listScopeSchedules: operatorCompanyProcedure
    .input(listScopeSchedulesSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:read");
      return listSchedulesForScope(ctx.prisma, {
        routeIds: input.routeIds,
        companyId: ctx.companyId,
        limit: input.limit,
      });
    }),

  listScopeTrips: operatorCompanyProcedure
    .input(listScopeTripsSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:read");
      return listTripsForScope(ctx.prisma, {
        scheduleIds: input.scheduleIds,
        routeIds: input.routeIds,
        companyId: ctx.companyId,
        daysAhead: input.daysAhead,
        limit: input.limit,
      });
    }),

  createCampaign: operatorCompanyProcedure
    .input(operatorCreateCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:create");
      return createCampaign(ctx.prisma, input, {
        ownerType: "OPERATOR",
        companyId: ctx.companyId,
        createdByUserId: ctx.user.id,
        fundingType: "OPERATOR",
      });
    }),

  updateCampaign: operatorCompanyProcedure
    .input(updateCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:update");
      const { id, scopes, fundingType: _funding, ...data } = input;
      const existing = await ctx.prisma.discountCampaign.findFirst({
        where: { id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      if (existing.pausedByAdminAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Campaign paused by platform admin",
        });
      }
      return ctx.prisma.$transaction(async (tx) => {
        await tx.discountCampaign.update({
          where: { id },
          data: {
            ...omitUndefined(data as Record<string, unknown>),
            fundingType: "OPERATOR",
          },
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

  setCampaignStatus: operatorCompanyProcedure
    .input(setCampaignStatusSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:pause");
      const existing = await ctx.prisma.discountCampaign.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      if (existing.pausedByAdminAt && input.status === "ACTIVE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only platform admin can resume this campaign",
        });
      }
      return ctx.prisma.discountCampaign.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  createCoupon: operatorCompanyProcedure
    .input(createCouponSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:create");
      const campaign = await ctx.prisma.discountCampaign.findFirst({
        where: { id: input.campaignId, companyId: ctx.companyId },
      });
      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      return ctx.prisma.couponCode.create({
        data: omitUndefined(input as Record<string, unknown>) as {
          campaignId: string;
          code: string;
        },
      });
    }),

  bulkCreateCoupons: operatorCompanyProcedure
    .input(bulkCreateCouponsSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:create");
      const campaign = await ctx.prisma.discountCampaign.findFirst({
        where: { id: input.campaignId, companyId: ctx.companyId },
        select: { id: true },
      });
      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      const { bulkCreateCouponCodes } = await import(
        "@/features/discounts/services/bulk-coupon-create"
      );
      return bulkCreateCouponCodes(ctx.prisma, {
        campaignId: input.campaignId,
        prefix: input.prefix,
        count: input.count,
        maxRedemptions: input.maxRedemptions,
        expiresAt: input.expiresAt,
      });
    }),

  deactivateCoupon: operatorCompanyProcedure
    .input(deactivateCouponSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:update");
      const coupon = await ctx.prisma.couponCode.findUnique({
        where: { id: input.id },
        include: { campaign: true },
      });
      if (!coupon || coupon.campaign.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Coupon not found" });
      }
      return ctx.prisma.couponCode.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  listPlatformOptIns: operatorCompanyProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "promotions:read");
    return ctx.prisma.discountCampaign.findMany({
      where: {
        ownerType: "PLATFORM",
        requireOperatorOptIn: true,
        status: { in: ["ACTIVE", "SCHEDULED"] },
      },
      include: {
        companyOptIns: { where: { companyId: ctx.companyId } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  setPlatformOptIn: operatorCompanyProcedure
    .input(campaignOptInSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:update");
      const campaign = await ctx.prisma.discountCampaign.findFirst({
        where: {
          id: input.campaignId,
          ownerType: "PLATFORM",
          requireOperatorOptIn: true,
        },
      });
      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      return ctx.prisma.campaignCompanyOptIn.upsert({
        where: {
          campaignId_companyId: {
            campaignId: input.campaignId,
            companyId: ctx.companyId,
          },
        },
        create: {
          campaignId: input.campaignId,
          companyId: ctx.companyId,
          status: input.status,
        },
        update: { status: input.status },
      });
    }),

  promotionsSummary: operatorCompanyProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "promotions:read");
    const [active, redemptions] = await Promise.all([
      ctx.prisma.discountCampaign.count({
        where: { companyId: ctx.companyId, status: "ACTIVE" },
      }),
      ctx.prisma.discountRedemption.aggregate({
        where: {
          status: "FINALIZED",
          campaign: { companyId: ctx.companyId },
        },
        _count: true,
        _sum: {
          ticketDiscountXOF: true,
          operatorFundedXOF: true,
        },
      }),
    ]);
    return {
      activeCampaigns: active,
      confirmedRedemptions: redemptions._count,
      ticketDiscountXOF: redemptions._sum.ticketDiscountXOF ?? 0,
      operatorFundedXOF: redemptions._sum.operatorFundedXOF ?? 0,
    };
  }),

  listRedemptions: operatorCompanyProcedure
    .input(listRedemptionsSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "promotions:read");
      if (input.campaignId) {
        const campaign = await ctx.prisma.discountCampaign.findFirst({
          where: { id: input.campaignId, companyId: ctx.companyId },
          select: { id: true },
        });
        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }
      }
      if (input.couponCodeId) {
        const coupon = await ctx.prisma.couponCode.findUnique({
          where: { id: input.couponCodeId },
          include: { campaign: { select: { companyId: true } } },
        });
        if (!coupon || coupon.campaign.companyId !== ctx.companyId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Coupon not found",
          });
        }
      }
      const { listDiscountRedemptions } = await import(
        "@/features/discounts/services/redemption-list"
      );
      return listDiscountRedemptions(ctx.prisma, {
        campaignId: input.campaignId,
        couponCodeId: input.couponCodeId,
        status: input.status,
        limit: input.limit,
        offset: input.offset,
        companyId: ctx.companyId,
        privacy: true,
      });
    }),
});
