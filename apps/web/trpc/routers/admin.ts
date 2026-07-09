import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminVerifyCompanySchema,
  adminRejectCompanySchema,
  adminListUsersSchema,
  adminUpdateUserRoleSchema,
  adminListOperationsSchema,
} from "@moja/schemas";
import { createTRPCRouter, protectedProcedure } from "../init";
import { revealBankAccountNumber } from "@/lib/bank-account";
import { PaystackProvider } from "@/features/payments/providers/paystack-provider";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = createTRPCRouter({
  getDashboardKPIs: adminProcedure.query(async ({ ctx }) => {
    const [
      successfulPayments,
      confirmedPricing,
      travelersCount,
      operatorsCount,
      pendingOperatorsCount,
      activeTripsCount,
    ] = await Promise.all([
      ctx.prisma.payment.findMany({
        where: { status: "SUCCESS" },
        select: { amountXOF: true },
      }),
      ctx.prisma.pricingSnapshot.findMany({
        where: { holdGroup: { status: "CONFIRMED" } },
        select: { platformGrossXOF: true },
      }),
      ctx.prisma.user.count({
        where: { role: "TRAVELER" },
      }),
      ctx.prisma.company.count(),
      ctx.prisma.company.count({
        where: { status: "PENDING_VERIFICATION" },
      }),
      ctx.prisma.trip.count({
        where: { status: { in: ["BOARDING", "DEPARTED"] } },
      }),
    ]);

    const totalGMV = successfulPayments.reduce((sum, p) => sum + p.amountXOF, 0);
    const totalCommission = confirmedPricing.reduce((sum, s) => sum + s.platformGrossXOF, 0);

    return {
      totalGMV,
      totalCommission,
      travelersCount,
      operatorsCount,
      pendingOperatorsCount,
      activeTripsCount,
    };
  }),

  listPendingOperators: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.company.findMany({
      where: { status: "PENDING_VERIFICATION" },
      include: {
        documents: true,
        bankAccounts: true,
        operators: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  verifyOperator: adminProcedure
    .input(adminVerifyCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.companyId },
        include: { bankAccounts: true },
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      const pendingBank = company.bankAccounts.find((b) => !b.isVerified) || company.bankAccounts[0];
      if (!pendingBank) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Company does not have a bank account registered",
        });
      }

      const decryptedAccountNumber = revealBankAccountNumber(pendingBank as any);

      // Create Paystack subaccount
      const paystack = new PaystackProvider();
      let subaccountCode = "";
      try {
        const result = await paystack.createSubaccount({
          businessName: company.name,
          settlementBankCode: input.bankCode,
          accountNumber: decryptedAccountNumber,
        });
        subaccountCode = result.subaccountCode;
      } catch (error: any) {
        console.error("Paystack Subaccount Registration Error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Paystack registration failed: ${error.message || "Unknown error"}`,
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: input.companyId },
          data: {
            status: "ACTIVE",
            paystackSubaccountCode: subaccountCode,
            verifiedAt: new Date(),
            verifiedById: ctx.user.id,
            rejectionReason: null,
          },
        });

        await tx.bankAccount.update({
          where: { id: pendingBank.id },
          data: {
            isVerified: true,
            isDefault: true,
            verifiedAt: new Date(),
            verifiedById: ctx.user.id,
            paystackSubaccountCode: subaccountCode,
          },
        });

        await tx.activityLog.create({
          data: {
            companyId: input.companyId,
            userId: ctx.user.id,
            action: "VERIFY_COMPANY",
            description: `Approved company verification. Registered Paystack subaccount ${subaccountCode}.`,
          },
        });
      });

      return { success: true, subaccountCode };
    }),

  rejectOperator: adminProcedure
    .input(adminRejectCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.companyId },
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: input.companyId },
          data: {
            status: "REJECTED",
            rejectionReason: input.reason,
            verifiedAt: null,
            verifiedById: null,
          },
        });

        await tx.activityLog.create({
          data: {
            companyId: input.companyId,
            userId: ctx.user.id,
            action: "REJECT_COMPANY",
            description: `Rejected company verification. Reason: ${input.reason}`,
          },
        });
      });

      return { success: true };
    }),

  listUsers: adminProcedure
    .input(adminListUsersSchema)
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.role) {
        where.role = input.role;
      }

      if (input.search) {
        where.OR = [
          { fullName: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { phone: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            operatorProfiles: {
              include: {
                company: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return { items, total };
    }),

  updateUserRole: adminProcedure
    .input(adminUpdateUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      return { success: true };
    }),

  suspendCompany: adminProcedure
    .input(z.object({ companyId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.companyId },
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: input.companyId },
          data: { status: "SUSPENDED" },
        });

        await tx.operator.updateMany({
          where: { companyId: input.companyId },
          data: { status: "SUSPENDED" },
        });

        await tx.activityLog.create({
          data: {
            companyId: input.companyId,
            userId: ctx.user.id,
            action: "SUSPEND_COMPANY",
            description: "Suspended company access and all operator staff.",
          },
        });
      });

      return { success: true };
    }),

  activateCompany: adminProcedure
    .input(z.object({ companyId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.companyId },
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: input.companyId },
          data: { status: "ACTIVE" },
        });

        await tx.operator.updateMany({
          where: { companyId: input.companyId },
          data: { status: "ACTIVE" },
        });

        await tx.activityLog.create({
          data: {
            companyId: input.companyId,
            userId: ctx.user.id,
            action: "ACTIVATE_COMPANY",
            description: "Restored company access and operator staff status to active.",
          },
        });
      });

      return { success: true };
    }),

  listOperations: adminProcedure
    .input(adminListOperationsSchema)
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.companyId) {
        where.companyId = input.companyId;
      }

      const [items, total] = await Promise.all([
        ctx.prisma.trip.findMany({
          where,
          orderBy: { departureDate: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            company: { select: { name: true } },
            schedule: {
              include: {
                route: {
                  select: {
                    name: true,
                    originTerminal: { select: { name: true, city: true } },
                    destTerminal: { select: { name: true, city: true } },
                  },
                },
              },
            },
            bookings: {
              where: { status: "CONFIRMED" },
              select: { id: true },
            },
          },
        }),
        ctx.prisma.trip.count({ where }),
      ]);

      const list = items.map((trip) => ({
        id: trip.id,
        companyName: trip.company.name,
        routeLabel: trip.schedule.route.name || `${trip.schedule.route.originTerminal.city || trip.schedule.route.originTerminal.name} → ${trip.schedule.route.destTerminal.city || trip.schedule.route.destTerminal.name}`,
        departureDate: trip.departureDate,
        status: trip.status,
        delayMinutes: trip.delayMinutes ?? 0,
        occupantCount: trip.bookings.length,
      }));

      return { items: list, total };
    }),

  verifyBankAccount: adminProcedure
    .input(z.object({
      bankAccountId: z.string(),
      bankCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const bankAccount = await ctx.prisma.bankAccount.findUnique({
        where: { id: input.bankAccountId },
        include: { company: true },
      });

      if (!bankAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank account not found",
        });
      }

      const bankCode = bankAccount.bankCode || input.bankCode;
      if (!bankCode) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bank code is required but missing from record.",
        });
      }

      const decryptedAccountNumber = revealBankAccountNumber(bankAccount);

      // Create Paystack subaccount
      const paystack = new PaystackProvider();
      let subaccountCode = "";
      try {
        const result = await paystack.createSubaccount({
          businessName: bankAccount.company.name,
          settlementBankCode: bankCode,
          accountNumber: decryptedAccountNumber,
        });
        subaccountCode = result.subaccountCode;
      } catch (error: any) {
        console.error("Paystack Subaccount Registration Error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Paystack registration failed: ${error.message || "Unknown error"}`,
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        // Check if there is already a default bank account for the company
        const existingDefault = await tx.bankAccount.findFirst({
          where: { companyId: bankAccount.companyId, isDefault: true, isVerified: true },
        });

        const isDefault = !existingDefault;

        await tx.bankAccount.update({
          where: { id: input.bankAccountId },
          data: {
            isVerified: true,
            isDefault,
            verifiedAt: new Date(),
            verifiedById: ctx.user.id,
            paystackSubaccountCode: subaccountCode,
          },
        });

        if (isDefault) {
          await tx.company.update({
            where: { id: bankAccount.companyId },
            data: { paystackSubaccountCode: subaccountCode },
          });
        }

        await tx.activityLog.create({
          data: {
            companyId: bankAccount.companyId,
            userId: ctx.user.id,
            action: "VERIFY_COMPANY",
            description: `Approved bank account. Registered Paystack subaccount ${subaccountCode}.`,
          },
        });
      });

      return { success: true, subaccountCode };
    }),

  rejectBankAccount: adminProcedure
    .input(z.object({
      bankAccountId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const bankAccount = await ctx.prisma.bankAccount.findUnique({
        where: { id: input.bankAccountId },
      });

      if (!bankAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank account not found",
        });
      }

      await ctx.prisma.bankAccount.update({
        where: { id: input.bankAccountId },
        data: {
          isActive: false,
          isVerified: false,
        },
      });

      await ctx.prisma.activityLog.create({
        data: {
          companyId: bankAccount.companyId,
          userId: ctx.user.id,
          action: "UPDATE_COMPANY",
          description: `Rejected bank account: ${input.reason}`,
        },
      });

      return { success: true };
    }),
});
