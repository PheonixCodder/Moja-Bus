import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  cancelBookingSchema,
  createCommissionTierSchema,
  deleteCommissionTierSchema,
  exportOperatorLedgerSchema,
  getCheckoutPricingSchema,
  listLedgerEntriesSchema,
  recordSettlementSchema,
  updateCommissionTierSchema,
  updatePlatformSettingsSchema,
} from "@moja/schemas";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";
import { PaymentService } from "@/features/payments/payment-service";
import { paystackListBanks } from "@/features/payments/providers/paystack-client";
import { CancellationService } from "@/features/payments/services/cancellation-service";
import { TripDetailsService } from "@/features/booking/services/trip-details-service";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const paymentsRouter = createTRPCRouter({
  getCheckoutPricing: publicProcedure
    .input(getCheckoutPricingSchema)
    .query(async ({ ctx, input }) => {
      const tripDetails = new TripDetailsService(ctx.prisma);
      const details = await tripDetails.getTripDetails(input.offerId);
      const trip = await ctx.prisma.trip.findUnique({
        where: { id: details.tripId },
        select: {
          schedule: { select: { route: { select: { distanceKm: true } } } },
        },
      });
      const paymentService = new PaymentService(ctx.prisma);
      return paymentService.getPricingPreview({
        baseFareXOF: details.priceXOF,
        seatCount: input.seatCount,
        distanceKm: trip?.schedule.route.distanceKm ?? null,
      });
    }),

  cancelBooking: protectedProcedure
    .input(cancelBookingSchema)
    .mutation(async ({ ctx, input }) => {
      let userCompanyId: string | undefined;
      if (ctx.user.role === "OPERATOR") {
        const operatorProfile = await ctx.prisma.operator.findFirst({
          where: { userId: ctx.user.id, deletedAt: null },
        });
        userCompanyId = operatorProfile?.companyId ?? undefined;
      }

      const service = new CancellationService(ctx.prisma);
      return service.cancelBooking({
        bookingReference: input.bookingReference,
        userId: ctx.user.id,
        userRole: ctx.user.role as any,
        userCompanyId,
        channel: input.channel as any,
        ...(input.reason ? { reason: input.reason } : {}),
      });
    }),

  getPlatformSettings: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.platformSettings.findUnique({
      where: { id: "default" },
    });
    if (!settings) {
      return ctx.prisma.platformSettings.create({ data: { id: "default" } });
    }
    return settings;
  }),

  updatePlatformSettings: adminProcedure
    .input(updatePlatformSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { defaultCommissionBps, defaultConvenienceFeeBps } = input;
      return ctx.prisma.platformSettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          ...(defaultCommissionBps != null
            ? { defaultCommissionBps }
            : {}),
          ...(defaultConvenienceFeeBps != null
            ? { defaultConvenienceFeeBps }
            : {}),
        },
        update: {
          ...(defaultCommissionBps != null
            ? { defaultCommissionBps }
            : {}),
          ...(defaultConvenienceFeeBps != null
            ? { defaultConvenienceFeeBps }
            : {}),
        },
      });
    }),

  listCommissionTiers: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.commissionDistanceTier.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }),

  createCommissionTier: adminProcedure
    .input(createCommissionTierSchema)
    .mutation(async ({ ctx, input }) => {
      const { maxDistanceKm, ...rest } = input;
      return ctx.prisma.commissionDistanceTier.create({
        data: {
          ...rest,
          maxDistanceKm: maxDistanceKm ?? null,
        },
      });
    }),

  updateCommissionTier: adminProcedure
    .input(updateCommissionTierSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, maxDistanceKm, ...data } = input;
      return ctx.prisma.commissionDistanceTier.update({
        where: { id },
        data: {
          ...data,
          ...(maxDistanceKm !== undefined ? { maxDistanceKm } : {}),
        },
      });
    }),

  deleteCommissionTier: adminProcedure
    .input(deleteCommissionTierSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.commissionDistanceTier.delete({
        where: { id: input.id },
      });
      return { success: true as const };
    }),

  listLedgerEntries: adminProcedure
    .input(listLedgerEntriesSchema)
    .query(async ({ ctx, input }) => {
      const where = input.companyId ? { companyId: input.companyId } : {};
      const [items, total] = await Promise.all([
        ctx.prisma.operatorLedgerEntry.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            company: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.operatorLedgerEntry.count({ where }),
      ]);
      return { items, total };
    }),

  exportOperatorLedger: adminProcedure
    .input(exportOperatorLedgerSchema)
    .query(async ({ ctx, input }) => {
      const entries = await ctx.prisma.operatorLedgerEntry.findMany({
        where: { companyId: input.companyId },
        orderBy: { createdAt: "asc" },
      });

      const balance = entries.reduce((sum, entry) => {
        return entry.entryType === "CREDIT"
          ? sum + entry.amountXOF
          : sum - entry.amountXOF;
      }, 0);

      return {
        companyId: input.companyId,
        entryCount: entries.length,
        balanceXOF: balance,
        entries,
      };
    }),

  recordSettlement: adminProcedure
    .input(recordSettlementSchema)
    .mutation(async ({ ctx, input }) => {
      const exportData = await ctx.prisma.operatorLedgerEntry.findMany({
        where: { companyId: input.companyId },
        orderBy: { createdAt: "asc" },
      });

      const balance = exportData.reduce((sum, entry) => {
        return entry.entryType === "CREDIT"
          ? sum + entry.amountXOF
          : sum - entry.amountXOF;
      }, 0);

      if (input.amountXOF > balance) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Settlement amount exceeds ledger balance",
        });
      }

      await ctx.prisma.operatorLedgerEntry.create({
        data: {
          companyId: input.companyId,
          entryType: "DEBIT",
          sourceType: "SETTLEMENT",
          amountXOF: input.amountXOF,
          description: input.note ?? "Manual operator settlement payout",
          metadata: { settledByUserId: ctx.user.id },
        },
      });

      return { success: true as const, remainingBalanceXOF: balance - input.amountXOF };
    }),

  listBanks: publicProcedure
    .input(
      z.object({
        country: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await paystackListBanks(input.country);
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to fetch bank list from Paystack",
        });
      }
    }),
});
