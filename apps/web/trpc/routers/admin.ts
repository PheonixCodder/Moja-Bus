import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminVerifyCompanySchema,
  adminRejectCompanySchema,
  adminListUsersSchema,
  adminUpdateUserRoleSchema,
  adminListOperationsSchema,
} from "@moja/schemas";
import { FinancialAccountService, AccountingEngine } from "@moja/db";
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
      ctx.prisma.externalPayment.findMany({
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
        include: {
          bankAccounts: true,
          operators: {
            where: { role: "OWNER" },
            include: { user: { select: { email: true, fullName: true } } },
          },
        },
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

      // Create Paystack Transfer Recipient
      const paystack = new PaystackProvider();
      let recipientCode = "";
      try {
        const result = await paystack.createTransferRecipient({
          businessName: company.name,
          bankCode: input.bankCode,
          accountNumber: decryptedAccountNumber,
        });
        recipientCode = result.recipientCode;
      } catch (error: any) {
        console.error("Paystack Transfer Recipient Registration Error:", error);
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
            paystackTransferRecipientCode: recipientCode,
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
            paystackTransferRecipientCode: recipientCode,
          },
        });

        await tx.activityLog.create({
          data: {
            companyId: input.companyId,
            userId: ctx.user.id,
            action: "VERIFY_COMPANY",
            description: `Approved company verification. Registered Paystack transfer recipient ${recipientCode}.`,
          },
        });

        const accountService = new FinancialAccountService(tx as any);
        await accountService.getOperatorReceivableAccount(input.companyId);
      });

      const ownerUser = company.operators[0]?.user;
      if (ownerUser?.email) {
        const novuSecret = process.env["NOVU_SECRET_KEY"];
        if (novuSecret) {
          try {
            const { Novu } = await import("@novu/api");
            const novu = new Novu({ secretKey: novuSecret });
            await novu.trigger({
              workflowId: "operator-verification-approved",
              to: {
                subscriberId: ownerUser.email,
                email: ownerUser.email,
              },
              payload: {
                email: ownerUser.email,
                ownerName: ownerUser.fullName ?? "Operator Owner",
                companyName: company.name,
              },
            });
          } catch (err) {
            console.error("Failed to trigger operator-verification-approved via Novu:", err);
          }
        }
      }

      return { success: true, recipientCode };
    }),

  rejectOperator: adminProcedure
    .input(adminRejectCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.companyId },
        include: {
          operators: {
            where: { role: "OWNER" },
            include: { user: { select: { email: true, fullName: true } } },
          },
        },
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

      const ownerUser = company.operators[0]?.user;
      if (ownerUser?.email) {
        const novuSecret = process.env["NOVU_SECRET_KEY"];
        if (novuSecret) {
          try {
            const { Novu } = await import("@novu/api");
            const novu = new Novu({ secretKey: novuSecret });
            await novu.trigger({
              workflowId: "operator-verification-rejected",
              to: {
                subscriberId: ownerUser.email,
                email: ownerUser.email,
              },
              payload: {
                email: ownerUser.email,
                ownerName: ownerUser.fullName ?? "Operator Owner",
                companyName: company.name,
                reason: input.reason,
              },
            });
          } catch (err) {
            console.error("Failed to trigger operator-verification-rejected via Novu:", err);
          }
        }
      }

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

      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret && updatedUser.email) {
        try {
          const { Novu } = await import("@novu/api");
          const novu = new Novu({ secretKey: novuSecret });
          await novu.trigger({
            workflowId: "user-role-updated",
            to: {
              subscriberId: updatedUser.email,
              email: updatedUser.email,
            },
            payload: {
              email: updatedUser.email,
              userName: updatedUser.fullName ?? "User",
              newRole: input.role as any,
            },
          }).catch(() => {});
        } catch (err) {
          console.error("Failed to trigger user-role-updated:", err);
        }
      }

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

      // Trigger operator-account-suspended
      const operators = await ctx.prisma.operator.findMany({
        where: { companyId: input.companyId, deletedAt: null },
        include: { user: { select: { email: true, fullName: true, phone: true } } },
      });
      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret && operators.length > 0) {
        try {
          const { Novu } = await import("@novu/api");
          const novu = new Novu({ secretKey: novuSecret });
          for (const op of operators) {
            if (op.user.email) {
              await novu.trigger({
                workflowId: "operator-account-suspended",
                to: {
                  subscriberId: op.user.email,
                  email: op.user.email,
                },
                payload: {
                  email: op.user.email,
                  operatorName: op.user.fullName ?? "Operator Staff",
                  companyName: company.name,
                  phone: op.user.phone ?? undefined,
                },
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error("Failed to trigger operator-account-suspended:", err);
        }
      }

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

      // Trigger operator-account-restored
      const owners = await ctx.prisma.operator.findMany({
        where: { companyId: input.companyId, role: "OWNER", deletedAt: null },
        include: { user: { select: { email: true, fullName: true } } },
      });
      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret && owners.length > 0) {
        try {
          const { Novu } = await import("@novu/api");
          const novu = new Novu({ secretKey: novuSecret });
          for (const owner of owners) {
            if (owner.user.email) {
              await novu.trigger({
                workflowId: "operator-account-restored",
                to: {
                  subscriberId: owner.user.email,
                  email: owner.user.email,
                },
                payload: {
                  email: owner.user.email,
                  ownerName: owner.user.fullName ?? "Operator Owner",
                  companyName: company.name,
                },
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error("Failed to trigger operator-account-restored:", err);
        }
      }

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

      // Create Paystack transfer recipient
      const paystack = new PaystackProvider();
      let recipientCode = "";
      try {
        const result = await paystack.createTransferRecipient({
          businessName: bankAccount.company.name,
          bankCode: bankCode,
          accountNumber: decryptedAccountNumber,
        });
        recipientCode = result.recipientCode;
      } catch (error: any) {
        console.error("Paystack Transfer Recipient Registration Error:", error);
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
            paystackTransferRecipientCode: recipientCode,
          },
        });

        if (isDefault) {
          await tx.company.update({
            where: { id: bankAccount.companyId },
            data: { paystackTransferRecipientCode: recipientCode },
          });
        }

        await tx.activityLog.create({
          data: {
            companyId: bankAccount.companyId,
            userId: ctx.user.id,
            action: "VERIFY_COMPANY",
            description: `Approved bank account. Registered Paystack transfer recipient ${recipientCode}.`,
          },
        });
      });

      // Trigger operator-bank-verified to Owners
      const owners = await ctx.prisma.operator.findMany({
        where: { companyId: bankAccount.companyId, role: "OWNER", deletedAt: null },
        include: { user: { select: { email: true, fullName: true } } },
      });
      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret && owners.length > 0) {
        try {
          const { Novu } = await import("@novu/api");
          const novu = new Novu({ secretKey: novuSecret });
          const hiddenNum = `******${bankAccount.accountNumberLast4}`;
          for (const owner of owners) {
            if (owner.user.email) {
              await novu.trigger({
                workflowId: "operator-bank-verified",
                to: {
                  subscriberId: owner.user.email,
                  email: owner.user.email,
                },
                payload: {
                  email: owner.user.email,
                  ownerName: owner.user.fullName ?? "Operator Owner",
                  companyName: bankAccount.company.name,
                  bankName: bankAccount.bankName,
                  accountNumberHidden: hiddenNum,
                },
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error("Failed to trigger operator-bank-verified via Novu:", err);
        }
      }

      return { success: true, recipientCode };
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

      // Trigger operator-bank-rejected to Owners
      const owners = await ctx.prisma.operator.findMany({
        where: { companyId: bankAccount.companyId, role: "OWNER", deletedAt: null },
        include: { user: { select: { email: true, fullName: true } } },
      });
      const company = await ctx.prisma.company.findUnique({
        where: { id: bankAccount.companyId },
        select: { name: true },
      });
      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret && owners.length > 0 && company) {
        try {
          const { Novu } = await import("@novu/api");
          const novu = new Novu({ secretKey: novuSecret });
          const hiddenNum = `******${bankAccount.accountNumberLast4}`;
          for (const owner of owners) {
            if (owner.user.email) {
              await novu.trigger({
                workflowId: "operator-bank-rejected",
                to: {
                  subscriberId: owner.user.email,
                  email: owner.user.email,
                },
                payload: {
                  email: owner.user.email,
                  ownerName: owner.user.fullName ?? "Operator Owner",
                  companyName: company.name,
                  bankName: bankAccount.bankName,
                  accountNumberHidden: hiddenNum,
                  reason: input.reason,
                },
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error("Failed to trigger operator-bank-rejected via Novu:", err);
        }
      }

      return { success: true };
    }),

  listAllWithdrawals: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        type: "OPERATOR_PAYOUT",
      };
      if (input.status && input.status !== "ALL") {
        where.status = input.status;
      }

      const [items, total] = await Promise.all([
        ctx.prisma.financialTransaction.findMany({
          where,
          include: {
            entries: {
              include: {
                account: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.financialTransaction.count({ where }),
      ]);

      const companyIds = Array.from(
        new Set(
          items.flatMap((tx) =>
            tx.entries
              .filter((e) => e.account.ownerType === "COMPANY")
              .map((e) => e.account.ownerId)
          )
        )
      );

      const companies = await ctx.prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true },
      });
      const companyMap = new Map(companies.map((c) => [c.id, c.name]));

      return {
        items: items.map((tx) => {
          const operatorEntry = tx.entries.find(
            (e) => e.account.accountClass === "OPERATOR_RECEIVABLE"
          );
          const companyId = operatorEntry?.account.ownerId || "";
          const companyName = companyMap.get(companyId) || "Unknown Operator";

          return {
            id: tx.id,
            status: tx.status,
            externalPaymentId: tx.externalPaymentId,
            description: tx.description,
            metadata: tx.metadata,
            createdAt: tx.createdAt,
            amount: Number(operatorEntry?.amount || 0),
            companyId,
            companyName,
          };
        }),
        total,
      };
    }),

  resolveWithdrawal: adminProcedure
    .input(
      z.object({
        transactionId: z.string(),
        action: z.enum(["FORCE_COMPLETE", "FORCE_FAIL"]),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tx = await ctx.prisma.financialTransaction.findUnique({
        where: { id: input.transactionId },
        include: { entries: { include: { account: true } } },
      });

      if (!tx || tx.type !== "OPERATOR_PAYOUT") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Withdrawal transaction not found",
        });
      }

      if (tx.status !== "CREATED" && tx.status !== "POSTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Transaction is already in status ${tx.status} and cannot be resolved.`,
        });
      }

      if (input.action === "FORCE_COMPLETE") {
        await ctx.prisma.financialTransaction.update({
          where: { id: tx.id },
          data: {
            status: "SETTLED",
            metadata: {
              ...(tx.metadata as object || {}),
              forceCompletedBy: ctx.user.id,
              forceCompleteReason: input.reason,
              forceCompletedAt: new Date(),
            },
          },
        });
      } else {
        await ctx.prisma.$transaction(async (prismaTx) => {
          const engine = new AccountingEngine("PAYOUT_REVERSAL", {
            ...(tx.externalPaymentId ? { externalPaymentId: tx.externalPaymentId } : {}),
            description: `Manual admin reversal: ${input.reason}`,
            metadata: {
              originalTxId: tx.id,
              reversedBy: ctx.user.id,
              reason: input.reason,
            },
          });

          for (const entry of tx.entries) {
            if (entry.side === "DEBIT") {
              engine.addCredit({
                accountId: entry.accountId,
                amount: Number(entry.amount),
                sequenceNumber: entry.sequenceNumber,
              });
            } else {
              engine.addDebit({
                accountId: entry.accountId,
                amount: Number(entry.amount),
                sequenceNumber: entry.sequenceNumber,
              });
            }
          }

          await engine.commit(prismaTx as any);

          await prismaTx.financialTransaction.update({
            where: { id: tx.id },
            data: {
              status: "FAILED",
              metadata: {
                ...(tx.metadata as object || {}),
                forceFailedBy: ctx.user.id,
                forceFailedReason: input.reason,
                forceFailedAt: new Date(),
              },
            },
          });
        });
      }

      // Trigger withdrawal resolution alerts
      const operatorEntry = tx.entries.find(
        (e) => e.account.accountClass === "OPERATOR_RECEIVABLE"
      );
      const companyId = operatorEntry?.account.ownerId || "";
      const company = await ctx.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });
      const owners = await ctx.prisma.operator.findMany({
        where: { companyId, role: "OWNER", deletedAt: null },
        include: { user: { select: { email: true, fullName: true } } },
      });

      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret && owners.length > 0 && company) {
        try {
          const { Novu } = await import("@novu/api");
          const novu = new Novu({ secretKey: novuSecret });
          const amountVal = Number(operatorEntry?.amount || 0);
          for (const owner of owners) {
            if (owner.user.email) {
              await novu.trigger({
                workflowId: "operator-withdrawal-resolved",
                to: {
                  subscriberId: owner.user.email,
                  email: owner.user.email,
                },
                payload: {
                  email: owner.user.email,
                  ownerName: owner.user.fullName ?? "Operator Owner",
                  companyName: company.name,
                  transactionId: input.transactionId,
                  amountXOF: amountVal,
                  status: input.action === "FORCE_COMPLETE" ? "SETTLED" : "FAILED",
                  reason: input.reason,
                },
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error("Failed to trigger operator-withdrawal-resolved:", err);
        }
      }

      if (input.action === "FORCE_FAIL" && novuSecret && company) {
        const admins = await ctx.prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { email: true },
        });
        if (admins.length > 0) {
          try {
            const { Novu } = await import("@novu/api");
            const novu = new Novu({ secretKey: novuSecret });
            const amountVal = Number(operatorEntry?.amount || 0);
            for (const admin of admins) {
              await novu.trigger({
                workflowId: "admin-payout-failed",
                to: {
                  subscriberId: admin.email,
                  email: admin.email,
                },
                payload: {
                  adminEmail: admin.email,
                  transactionId: input.transactionId,
                  companyName: company.name,
                  amountXOF: amountVal,
                  errorCode: "FORCE_FAIL",
                  errorMessage: input.reason,
                },
              }).catch(() => {});
            }
          } catch (err) {
            console.error("Failed to trigger admin-payout-failed:", err);
          }
        }
      }

      return { success: true };
    }),
});
