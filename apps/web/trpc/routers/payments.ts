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
import {
  isPaystackConfigured,
  paystackListBanks,
} from "../../features/payments/providers/paystack-client";
import { FinancialAccountService, AccountingEngine } from "@moja/db";
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

  getHoldPricing: protectedProcedure
    .input(z.object({ holdId: z.string() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await ctx.prisma.pricingSnapshot.findFirst({
        where: { holdGroupId: input.holdId },
        orderBy: { createdAt: "desc" },
      });
      if (!snapshot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pricing snapshot not found for this hold",
        });
      }
      return {
        subtotalBaseXOF: snapshot.subtotalBaseXOF,
        convenienceFeeXOF: snapshot.convenienceFeeXOF,
        chargeAmountXOF: snapshot.chargeAmountXOF,
      };
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
    .input(
      listLedgerEntriesSchema.extend({
        accountClass: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const accountService = new FinancialAccountService(ctx.prisma);
      let accountIds: string[] = [];

      const accountClass = input.accountClass || "OPERATOR_RECEIVABLE";

      if (accountClass === "OPERATOR_RECEIVABLE") {
        if (input.companyId) {
          const opAcct = await accountService.getOperatorReceivableAccount(input.companyId);
          accountIds.push(opAcct.id);
        } else {
          const opAccts = await ctx.prisma.financialAccount.findMany({
            where: { ownerType: "COMPANY", accountClass: "OPERATOR_RECEIVABLE" },
          });
          accountIds = opAccts.map((a) => a.id);
        }
      } else if (accountClass === "PAYSTACK_CLEARING") {
        const clearingAcct = await accountService.getSystemPaystackClearingAccount();
        accountIds.push(clearingAcct.id);
      } else if (accountClass === "PLATFORM_FEES") {
        const platformCommissionAcct = await accountService.getPlatformCommissionRevenueAccount();
        const platformConvenienceAcct = await accountService.getPlatformConvenienceFeeRevenueAccount();
        accountIds.push(platformCommissionAcct.id, platformConvenienceAcct.id);
      } else {
        const accts = await ctx.prisma.financialAccount.findMany({
          where: { accountClass },
        });
        accountIds = accts.map((a) => a.id);
      }

      const where = { accountId: { in: accountIds } };
      const [entries, total] = await Promise.all([
        ctx.prisma.ledgerEntry.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            account: true,
            transaction: true,
          },
        }),
        ctx.prisma.ledgerEntry.count({ where }),
      ]);

      const companyIds = Array.from(new Set(entries.map((e) => e.account.ownerId)));
      const companies = await ctx.prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true },
      });
      const companyMap = new Map(companies.map((c) => [c.id, c]));

      const items = entries.map((e) => {
        let name = "Unknown Account";
        if (e.account.ownerType === "SYSTEM") {
          name = "System Clearing";
        } else if (e.account.ownerType === "PLATFORM") {
          name = "Platform Fees";
        } else {
          const comp = companyMap.get(e.account.ownerId);
          if (comp) name = comp.name;
        }

        return {
          id: e.id,
          companyId: e.account.ownerId,
          company: { id: e.account.ownerId, name },
          entryType: e.side === "CREDIT" ? "CREDIT" : "DEBIT",
          sourceType: e.transaction.type,
          amountXOF: e.amount,
          description: e.description || e.transaction.description,
          createdAt: e.createdAt,
        };
      });

      return { items, total };
    }),

  getTreasuryOverview: adminProcedure.query(async ({ ctx }) => {
    const accountService = new FinancialAccountService(ctx.prisma);
    const [clearing, commissionRevenue, convenienceRevenue] = await Promise.all([
      accountService.getSystemPaystackClearingAccount(),
      accountService.getPlatformCommissionRevenueAccount(),
      accountService.getPlatformConvenienceFeeRevenueAccount(),
    ]);

    return {
      clearingBalance: Number(clearing.postedBalance),
      revenueBalance: Number(commissionRevenue.postedBalance) + Number(convenienceRevenue.postedBalance),
    };
  }),

  exportOperatorLedger: adminProcedure
    .input(exportOperatorLedgerSchema)
    .query(async ({ ctx, input }) => {
      const accountService = new FinancialAccountService(ctx.prisma);
      const operatorAcct = await accountService.getOperatorReceivableAccount(input.companyId);

      const entries = await ctx.prisma.ledgerEntry.findMany({
        where: { accountId: operatorAcct.id },
        orderBy: { createdAt: "asc" },
        include: { transaction: true },
      });

      const mappedEntries = entries.map(e => ({
        id: e.id,
        companyId: input.companyId,
        entryType: e.side === "CREDIT" ? "CREDIT" : "DEBIT",
        sourceType: e.transaction.type,
        amountXOF: Number(e.amount), // BigInt → Number; individual entries are safe
        description: e.description || e.transaction.description,
        createdAt: e.createdAt,
      }));

      return {
        companyId: input.companyId,
        entryCount: entries.length,
        balanceXOF: Number(operatorAcct.postedBalance),
        entries: mappedEntries,
      };
    }),

  recordSettlement: adminProcedure
    .input(recordSettlementSchema)
    .mutation(async ({ ctx, input }) => {
      const accountService = new FinancialAccountService(ctx.prisma);
      const operatorAcct = await accountService.getOperatorReceivableAccount(input.companyId);
      const clearingAcct = await accountService.getSystemPaystackClearingAccount();

      if (BigInt(input.amountXOF) > operatorAcct.availableBalance) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Settlement amount exceeds available ledger balance",
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        const engine = new AccountingEngine("SETTLEMENT", {
          description: input.note ?? "Manual operator settlement payout",
          metadata: { settledByUserId: ctx.user.id },
        });

        engine.addDebit({
          accountId: operatorAcct.id,
          amount: input.amountXOF,
          sequenceNumber: 1,
          referenceType: "SETTLEMENT",
          description: input.note ?? "Settlement payout",
        });

        engine.addCredit({
          accountId: clearingAcct.id,
          amount: input.amountXOF,
          sequenceNumber: 2,
          referenceType: "SETTLEMENT",
          description: "Settlement sent from clearing",
        });

        engine.validate();
        await engine.commit(tx as any);
      });

      // Refetch balance after settlement
      const updatedAcct = await ctx.prisma.financialAccount.findUniqueOrThrow({
        where: { id: operatorAcct.id },
      });

      return { success: true as const, remainingBalanceXOF: updatedAcct.postedBalance };
    }),

  listSettlementHistory: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const [transactions, total] = await Promise.all([
        ctx.prisma.financialTransaction.findMany({
          where: { type: "SETTLEMENT" },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            entries: {
              include: { account: true },
            },
          },
        }),
        ctx.prisma.financialTransaction.count({ where: { type: "SETTLEMENT" } }),
      ]);

      // Collect company IDs from DEBIT entries (operator receivable side)
      const companyIds = Array.from(
        new Set(
          transactions.flatMap((tx) =>
            tx.entries
              .filter(
                (e) => e.side === "DEBIT" && e.account.ownerType === "COMPANY"
              )
              .map((e) => e.account.ownerId)
          )
        )
      );

      const companies = await ctx.prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true },
      });
      const companyMap = new Map(companies.map((c) => [c.id, c]));

      const items = transactions.map((tx) => {
        const debitEntry = tx.entries.find(
          (e) => e.side === "DEBIT" && e.account.ownerType === "COMPANY"
        );
        const companyId = debitEntry?.account.ownerId ?? null;
        const company = companyId ? companyMap.get(companyId) : null;

        return {
          id: tx.id,
          operatorId: companyId,
          operatorName: company?.name ?? "Unknown Operator",
          amountXOF: debitEntry ? Number(debitEntry.amount) : 0,
          note: tx.description,
          metadata: tx.metadata as { settledByUserId?: string } | null,
          status: tx.status,
          createdAt: tx.createdAt,
        };
      });

      return { items, total };
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
