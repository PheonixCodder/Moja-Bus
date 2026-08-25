import { AccountingEngine, FinancialAccountService } from "@moja/db";
import {
  adminGetCompanySchema,
  adminListAllOffersSchema,
  adminListCompaniesSchema,
  adminListDriversForVerificationSchema,
  adminListLedgerEntriesSchema,
  adminListMarketplaceDriversSchema,
  adminListOperationsSchema,
  adminListUsersSchema,
  adminRejectCompanySchema,
  adminSetDriverMarketplaceStatusSchema,
  adminUpdateUserRoleSchema,
  adminUpdateVerificationChecklistSchema,
  adminVerifyCompanySchema,
  adminVerifyDriverSchema,
  MAX_FEATURED_DRIVERS,
  tripStatusEnum,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { enqueueDriverVerificationOutcome } from "@/features/notifications/outbox/driver-compliance";
import { createPresignedDownload } from "@/lib/storage";
import {
  enqueueDriverMarketplaceFeatured,
  enqueueDriverMarketplaceSuspended,
} from "@/features/notifications/outbox/marketplace-admin";
import {
  enqueueOperatorBankRejected,
  enqueueOperatorBankVerified,
} from "@/features/notifications/outbox/operator-bank";
import { PaystackProvider } from "@/features/payments/providers/paystack-provider";
import { logBankAccess } from "@/lib/bank-access";
import { revealBankAccountNumber } from "@/lib/bank-account";
import { suspendDriverOperationalState } from "@/lib/driver-run-state";
import { computeTrustBadges } from "@/lib/driver-scoring";
import { toSafeDisplayNumber } from "@/lib/money";
import { getNovuClient } from "@/lib/novu";
import {
  requireAdminAnyPermission,
  requireAdminPermission,
} from "@/lib/permissions/admin-authorize";
import { adminProcedure, createTRPCRouter } from "../init";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const adminRouter = createTRPCRouter({
  getDashboardKPIs: adminProcedure.query(async ({ ctx }) => {
    requireAdminPermission(ctx, "platform:financials:read");
    const [
      financialSnapshotResult,
      travelersCount,
      operatorsCount,
      pendingOperatorsCount,
      activeTripsCount,
    ] = await Promise.all([
      ctx.prisma.pricingSnapshot.aggregate({
        _sum: { subtotalBaseXOF: true, platformGrossXOF: true },
        where: { holdGroup: { status: "CONFIRMED" } },
      }),
      ctx.prisma.user.count({
        where: { role: "TRAVELER" },
      }),
      ctx.prisma.company.count(),
      ctx.prisma.company.count({
        where: { status: "PENDING_VERIFICATION" },
      }),
      ctx.prisma.trip.count({
        where: { status: { in: ["BOARDING", "DEPARTED"] }, archivedAt: null },
      }),
    ]);

    const totalGMV = financialSnapshotResult._sum.subtotalBaseXOF ?? 0;
    const totalCommission = financialSnapshotResult._sum.platformGrossXOF ?? 0;

    return {
      totalGMV,
      totalCommission,
      travelersCount,
      operatorsCount,
      pendingOperatorsCount,
      activeTripsCount,
    };
  }),

  listCompaniesForVerification: adminProcedure
    .input(adminListCompaniesSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "companies:read");

      const where: any = {};

      if (input.status) {
        where.status = input.status;
      }

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        where.OR = [
          { name: { contains: searchLower, mode: "insensitive" } },
          {
            registrationNumber: { contains: searchLower, mode: "insensitive" },
          },
          { taxId: { contains: searchLower, mode: "insensitive" } },
          {
            operators: {
              some: {
                user: {
                  fullName: { contains: searchLower, mode: "insensitive" },
                },
              },
            },
          },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.prisma.company.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            documents: true,
            bankAccounts: true,
            verification: true,
            operators: {
              where: { role: "OWNER" },
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        }),
        ctx.prisma.company.count({ where }),
      ]);

      return { items, total };
    }),

  getCompanyForVerification: adminProcedure
    .input(adminGetCompanySchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "companies:read");
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.companyId },
        include: {
          documents: true,
          bankAccounts: true,
          verification: true,
          operators: {
            where: { role: "OWNER" },
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
          activityLogs: {
            orderBy: { createdAt: "desc" },
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      return company;
    }),

  updateCompanyVerificationChecklist: adminProcedure
    .input(adminUpdateVerificationChecklistSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "verifications:manage");
      const verification = await ctx.prisma.companyVerification.upsert({
        where: { companyId: input.companyId },
        update: {
          ownerIdentityVerified: input.ownerIdentityVerified,
          bankVerified: input.bankVerified,
          documentsVerified: input.documentsVerified,
          permitVerified: input.permitVerified,
          reviewedById: ctx.user.id,
          reviewedAt: new Date(),
        },
        create: {
          companyId: input.companyId,
          ownerIdentityVerified: input.ownerIdentityVerified,
          bankVerified: input.bankVerified,
          documentsVerified: input.documentsVerified,
          permitVerified: input.permitVerified,
          reviewedById: ctx.user.id,
          reviewedAt: new Date(),
        },
      });

      await ctx.prisma.activityLog.create({
        data: {
          companyId: input.companyId,
          userId: ctx.user.id,
          action: "UPDATE_VERIFICATION_CHECKLIST",
          description: `Updated verification checklist progress flags: ID=${input.ownerIdentityVerified}, Bank=${input.bankVerified}, Docs=${input.documentsVerified}, Permit=${input.permitVerified}`,
        },
      });

      return verification;
    }),

  listLedgerEntries: adminProcedure
    .input(adminListLedgerEntriesSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "platform:ledger:read");
      const where: any = {};

      if (input.side) {
        where.side = input.side;
      }

      if (input.type) {
        where.transaction = { type: input.type };
      }

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        where.OR = [
          { description: { contains: searchLower, mode: "insensitive" } },
          { transactionId: { contains: searchLower, mode: "insensitive" } },
          { referenceId: { contains: searchLower, mode: "insensitive" } },
          {
            account: {
              ownerId: { contains: searchLower, mode: "insensitive" },
            },
          },
        ];
      }

      const [items, total, debitSumResult, creditSumResult] = await Promise.all(
        [
          ctx.prisma.ledgerEntry.findMany({
            where,
            orderBy: { effectiveAt: "desc" },
            take: input.limit,
            skip: input.offset,
            include: {
              transaction: true,
              account: true,
            },
          }),
          ctx.prisma.ledgerEntry.count({ where }),
          ctx.prisma.ledgerEntry.aggregate({
            _sum: { amount: true },
            where: { side: "DEBIT" },
          }),
          ctx.prisma.ledgerEntry.aggregate({
            _sum: { amount: true },
            where: { side: "CREDIT" },
          }),
        ],
      );

      const ownerIds = Array.from(
        new Set(items.map((item) => item.account.ownerId)),
      );

      const [users, companies] = await Promise.all([
        ctx.prisma.user.findMany({
          where: { id: { in: ownerIds } },
          select: { id: true, fullName: true, email: true },
        }),
        ctx.prisma.company.findMany({
          where: { id: { in: ownerIds } },
          select: { id: true, name: true },
        }),
      ]);

      const userMap = new Map(users.map((u) => [u.id, u]));
      const companyMap = new Map(companies.map((c) => [c.id, c]));

      const enrichedItems = items.map((item) => {
        let ownerName = "Platform Treasury";
        let ownerEmail = "treasury@mojaride.com";
        if (item.account.ownerType === "USER") {
          const u = userMap.get(item.account.ownerId);
          ownerName = u?.fullName || "Unknown Passenger";
          ownerEmail = u?.email || "";
        } else if (item.account.ownerType === "COMPANY") {
          const c = companyMap.get(item.account.ownerId);
          ownerName = c?.name || "Unknown Operator";
          ownerEmail = "";
        }
        return {
          ...item,
          ownerName,
          ownerEmail,
        };
      });

      const totalDebitVolume = debitSumResult._sum.amount || BigInt(0);
      const totalCreditVolume = creditSumResult._sum.amount || BigInt(0);
      const isBalanced = totalDebitVolume === totalCreditVolume;

      return {
        items: enrichedItems,
        total,
        totalDebitVolume,
        totalCreditVolume,
        isBalanced,
      };
    }),

  listPendingOperators: adminProcedure.query(async ({ ctx }) => {
    requireAdminPermission(ctx, "companies:read");
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
                phoneNumber: true,
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
      requireAdminPermission(ctx, "companies:verify");
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.companyId },
        include: {
          bankAccounts: true,
          operators: {
            where: { role: "OWNER" },
            include: {
              user: { select: { id: true, email: true, fullName: true } },
            },
          },
        },
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      const pendingBank =
        company.bankAccounts.find((b) => !b.isVerified) ||
        company.bankAccounts[0];
      if (!pendingBank) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Company does not have a bank account registered",
        });
      }

      const decryptedAccountNumber = revealBankAccountNumber(
        pendingBank as any,
      );
      // Audit-log the full bank-number reveal (operator reveals are logged;
      // admin reveals must be too — see F-22).
      await logBankAccess(ctx.prisma, {
        companyId: input.companyId,
        userId: ctx.user.id,
        action: "VIEW_FULL",
      });

      // The Paystack transfer recipient is now registered automatically at
      // bank-account save time (XOF has no /bank/resolve, so the recipient
      // creation is what validates the account number). Reuse that recipient
      // code; only fall back to creating one for legacy records.
      let recipientCode = pendingBank.paystackTransferRecipientCode ?? "";
      if (!recipientCode && pendingBank.bankCode) {
        const paystack = new PaystackProvider();
        try {
          const result = await paystack.createTransferRecipient({
            name: pendingBank.accountName || company.name,
            bankCode: pendingBank.bankCode,
            accountNumber: decryptedAccountNumber,
            type: (pendingBank.verificationPayload as any)?.type || "bceao",
            currency: "XOF",
          });
          recipientCode = result.recipientCode;
        } catch (error: any) {
          console.error(
            "Paystack Transfer Recipient Registration Error:",
            error,
          );
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Paystack registration failed: ${error.message || "Unknown error"}`,
          });
        }
      }

      const decidedAt = new Date();
      await ctx.prisma.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: input.companyId },
          data: {
            status: "ACTIVE",
            paystackTransferRecipientCode: recipientCode,
            verifiedAt: decidedAt,
            verifiedById: ctx.user.id,
            rejectionReason: null,
          },
        });

        await tx.bankAccount.update({
          where: { id: pendingBank.id },
          data: {
            isVerified: true,
            isDefault: true,
            verifiedAt: decidedAt,
            verifiedById: ctx.user.id,
            paystackTransferRecipientCode: recipientCode,
          },
        });

        // P2-3 (D5): durable owner notice, atomic with the verification write.
        await enqueueOperatorBankVerified(tx as any, {
          decidedAt,
          bankAccountId: pendingBank.id,
          companyName: company.name,
          bankName: pendingBank.bankName ?? "Registered bank",
          accountNumberLast4: (pendingBank as any).accountNumberLast4 ?? null,
          recipients: company.operators.map((o) => ({
            subscriberId: o.user.id,
            ...(o.user.email ? { email: o.user.email } : {}),
            ...(o.user.fullName
              ? { firstName: o.user.fullName.split(" ")[0] }
              : {}),
          })),
        });

        await tx.activityLog.create({
          data: {
            companyId: input.companyId,
            userId: ctx.user.id,
            action: "VERIFY_COMPANY",
            description: `Approved company verification. Paystack transfer recipient ${recipientCode}.`,
          },
        });

        const accountService = new FinancialAccountService(tx as any);
        await accountService.getOperatorReceivableAccount(input.companyId);
      });

      const ownerUser = company.operators[0]?.user;
      if (ownerUser?.email) {
        const novu = getNovuClient();
        if (novu) {
          try {
            await novu.trigger({
              workflowId: "operator-verification-approved",
              to: {
                subscriberId: ownerUser.id,
                email: ownerUser.email,
              },
              payload: {
                email: ownerUser.email,
                ownerName: ownerUser.fullName ?? "Operator Owner",
                companyName: company.name,
              },
              transactionId: `operator-verification-approved-${company.id}`,
            });
          } catch (err) {
            console.error(
              "Failed to trigger operator-verification-approved via Novu:",
              err,
            );
          }
        }
      }

      return { success: true, recipientCode };
    }),

  rejectOperator: adminProcedure
    .input(adminRejectCompanySchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "companies:verify");
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.companyId },
        include: {
          bankAccounts: true,
          operators: {
            where: { role: "OWNER" },
            include: {
              user: { select: { id: true, email: true, fullName: true } },
            },
          },
        },
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      const rejectedBank =
        company.bankAccounts.find((b) => !b.isVerified) ??
        company.bankAccounts[0] ??
        null;

      const rejectedAt = new Date();
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

        // P2-3 (D5): durable owner notice about their payout target being
        // rejected, atomic with the verification write.
        if (rejectedBank) {
          await enqueueOperatorBankRejected(tx as any, {
            decidedAt: rejectedAt,
            bankAccountId: rejectedBank.id,
            companyName: company.name,
            bankName: rejectedBank.bankName ?? "Registered bank",
            accountNumberLast4:
              (rejectedBank as any).accountNumberLast4 ?? null,
            reason: input.reason,
            recipients: company.operators.map((o) => ({
              subscriberId: o.user.id,
              ...(o.user.email ? { email: o.user.email } : {}),
              ...(o.user.fullName
                ? { firstName: o.user.fullName.split(" ")[0] }
                : {}),
            })),
          });
        }

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
        const novu = getNovuClient();
        if (novu) {
          try {
            await novu.trigger({
              workflowId: "operator-verification-rejected",
              to: {
                subscriberId: ownerUser.id,
                email: ownerUser.email,
              },
              payload: {
                email: ownerUser.email,
                ownerName: ownerUser.fullName ?? "Operator Owner",
                companyName: company.name,
                reason: input.reason,
              },
              transactionId: `operator-verification-rejected-${company.id}`,
            });
          } catch (err) {
            console.error(
              "Failed to trigger operator-verification-rejected via Novu:",
              err,
            );
          }
        }
      }

      return { success: true };
    }),

  listUsers: adminProcedure
    .input(adminListUsersSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "users:read");
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

  getUserProfile: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "users:read");
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          operatorProfiles: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                  logoUrl: true,
                  businessType: true,
                  registrationNumber: true,
                },
              },
              onboardingProgress: true,
            },
          },
          passengerProfile: {
            include: { savedPassengers: true },
          },
          bookings: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              company: { select: { name: true } },
              trip: {
                include: {
                  schedule: {
                    include: {
                      route: {
                        select: {
                          name: true,
                          originTerminal: {
                            select: { city: true, name: true },
                          },
                          destTerminal: { select: { city: true, name: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          sessions: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),

  updateUserRole: adminProcedure
    .input(adminUpdateUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "users:update");
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

      const novu = getNovuClient();
      if (novu && updatedUser.email) {
        try {
          await novu
            .trigger({
              workflowId: "user-role-updated",
              // Phase 08 (F-NF-03) — the affected account holder keys user.id.
              // Event-sourced txId (user+target role) replaces Date.now() so
              // re-applying the same role dedupes instead of never deduping.
              to: {
                subscriberId: updatedUser.id,
                email: updatedUser.email,
              },
              payload: {
                email: updatedUser.email,
                userName: updatedUser.fullName ?? "User",
                newRole: input.role as any,
              },
              transactionId: `user-role-updated-${updatedUser.id}-${input.role}`,
            })
            .catch(() => {});
        } catch (err) {
          console.error("Failed to trigger user-role-updated:", err);
        }
      }

      return { success: true };
    }),

  suspendCompany: adminProcedure
    .input(z.object({ companyId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "companies:suspend");
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
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
      });
      const novu = getNovuClient();
      if (novu && operators.length > 0) {
        try {
          for (const op of operators) {
            if (op.user.email) {
              await novu
                .trigger({
                  workflowId: "operator-account-suspended",
                  // Phase 08 (F-NF-03) — every affected operator staff keys
                  // user.id; day-bucketed txId replaces Date.now() so a
                  // repeated suspend action dedupes per day.
                  to: {
                    subscriberId: op.user.id,
                    email: op.user.email,
                  },
                  payload: {
                    email: op.user.email,
                    operatorName: op.user.fullName ?? "Operator Staff",
                    companyName: company.name,
                    phone: op.user.phoneNumber ?? undefined,
                  },
                  transactionId: `operator-account-suspended-${input.companyId}-${op.user.id}-${new Date().toISOString().slice(0, 10)}`,
                })
                .catch(() => {});
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
      requireAdminPermission(ctx, "companies:suspend");
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
            description:
              "Restored company access and operator staff status to active.",
          },
        });
      });

      // Trigger operator-account-restored
      const owners = await ctx.prisma.operator.findMany({
        where: { companyId: input.companyId, role: "OWNER", deletedAt: null },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });
      const novu = getNovuClient();
      if (novu && owners.length > 0) {
        try {
          for (const owner of owners) {
            if (owner.user.email) {
              await novu
                .trigger({
                  workflowId: "operator-account-restored",
                  // Phase 08 (F-NF-03) — user.id keying; day-bucketed txId
                  // replaces Date.now() so suspend/restore cycles dedupe
                  // within a day instead of never.
                  to: {
                    subscriberId: owner.user.id,
                    email: owner.user.email,
                  },
                  payload: {
                    email: owner.user.email,
                    ownerName: owner.user.fullName ?? "Operator Owner",
                    companyName: company.name,
                  },
                  transactionId: `operator-account-restored-${input.companyId}-${owner.user.id}-${new Date().toISOString().slice(0, 10)}`,
                })
                .catch(() => {});
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
      requireAdminPermission(ctx, "platform:trips:read");
      const where: any = {};
      where.archivedAt = null;
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
        routeLabel:
          trip.schedule?.route.name ||
          `${trip.schedule?.route.originTerminal.city || trip.schedule?.route.originTerminal.name} → ${trip.schedule?.route.destTerminal.city || trip.schedule?.route.destTerminal.name}`,
        departureDate: trip.departureDate,
        status: trip.status,
        delayMinutes: trip.delayMinutes ?? 0,
        occupantCount: trip.bookings.length,
      }));

      return { items: list, total };
    }),

  listAllWithdrawals: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
        status: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "platform:withdrawals:read");
      const dateFilter =
        input.from && input.to
          ? {
              createdAt: {
                gte: new Date(input.from),
                lte: new Date(input.to),
              },
            }
          : {};

      const where: any = {
        type: "OPERATOR_PAYOUT",
        ...dateFilter,
      };
      if (input.status && input.status.toUpperCase() !== "ALL") {
        where.status = input.status.toUpperCase();
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
              .map((e) => e.account.ownerId),
          ),
        ),
      );

      const companies = await ctx.prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true },
      });
      const companyMap = new Map(companies.map((c) => [c.id, c.name]));

      return {
        items: items.map((tx) => {
          const operatorEntry = tx.entries.find(
            (e) => e.account.accountClass === "OPERATOR_RECEIVABLE",
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
            amount: toSafeDisplayNumber(operatorEntry?.amount),
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "platform:withdrawals:resolve");
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
        const updated = await ctx.prisma.financialTransaction.updateMany({
          where: { id: tx.id, status: { in: ["CREATED", "POSTED"] } },
          data: {
            status: "SETTLED",
            metadata: {
              ...((tx.metadata as object) || {}),
              forceCompletedBy: ctx.user.id,
              forceCompleteReason: input.reason,
              forceCompletedAt: new Date(),
            },
          },
        });

        if (updated.count === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Transaction was already resolved.",
          });
        }
      } else {
        await ctx.prisma.$transaction(async (prismaTx) => {
          const updated = await prismaTx.financialTransaction.updateMany({
            where: { id: tx.id, status: { in: ["CREATED", "POSTED"] } },
            data: {
              status: "FAILED",
              metadata: {
                ...((tx.metadata as object) || {}),
                forceFailedBy: ctx.user.id,
                forceFailedReason: input.reason,
                forceFailedAt: new Date(),
              },
            },
          });

          if (updated.count === 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Transaction was already resolved.",
            });
          }

          const engine = new AccountingEngine("PAYOUT_REVERSAL", {
            ...(tx.externalPaymentId
              ? { externalPaymentId: tx.externalPaymentId }
              : {}),
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
                amount: toSafeDisplayNumber(entry.amount),
                sequenceNumber: entry.sequenceNumber,
              });
            } else {
              engine.addDebit({
                accountId: entry.accountId,
                amount: toSafeDisplayNumber(entry.amount),
                sequenceNumber: entry.sequenceNumber,
              });
            }
          }

          await engine.commit(prismaTx as any);

          // F-21: reverse the PAYMENT_PROCESSOR_FEE recorded at payout time.
          // Without this the platform keeps a phantom fee debit for a payout
          // that failed. Mirrors the webhook reversal in payment-service.ts.
          if (tx.externalPaymentId) {
            const feeTx = await prismaTx.financialTransaction.findFirst({
              where: {
                type: "PAYMENT_PROCESSOR_FEE",
                externalPaymentId: tx.externalPaymentId,
                status: { notIn: ["FAILED", "REVERSED"] },
              },
              include: { entries: true },
            });

            if (feeTx && feeTx.entries.length > 0) {
              const feeReverseEngine = new AccountingEngine(
                "PAYOUT_FEE_REVERSAL",
                {
                  externalPaymentId: tx.externalPaymentId,
                  description: `Fee reversal for manually failed payout ${tx.id}`,
                  metadata: {
                    originalFeeTxId: feeTx.id,
                    originalPayoutTxId: tx.id,
                    reversedBy: ctx.user.id,
                    reason: input.reason,
                  },
                },
              );

              for (const entry of feeTx.entries) {
                if (entry.side === "DEBIT") {
                  feeReverseEngine.addCredit({
                    accountId: entry.accountId,
                    amount: toSafeDisplayNumber(entry.amount),
                    sequenceNumber: entry.sequenceNumber,
                  });
                } else {
                  feeReverseEngine.addDebit({
                    accountId: entry.accountId,
                    amount: toSafeDisplayNumber(entry.amount),
                    sequenceNumber: entry.sequenceNumber,
                  });
                }
              }

              await feeReverseEngine.commit(prismaTx as any);

              await prismaTx.financialTransaction.update({
                where: { id: feeTx.id },
                data: { status: "REVERSED" },
              });
            }
          }
        });
      }

      // Trigger withdrawal resolution alerts
      const operatorEntry = tx.entries.find(
        (e) => e.account.accountClass === "OPERATOR_RECEIVABLE",
      );
      const companyId = operatorEntry?.account.ownerId || "";
      const company = await ctx.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });
      const owners = await ctx.prisma.operator.findMany({
        where: { companyId, role: "OWNER", deletedAt: null },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });

      const novu = getNovuClient();
      if (novu && owners.length > 0 && company) {
        try {
          const amountVal = toSafeDisplayNumber(operatorEntry?.amount);
          for (const owner of owners) {
            if (owner.user.email) {
              await novu
                .trigger({
                  workflowId: "operator-withdrawal-resolved",
                  // Phase 08 (F-NF-03) — logged-in owners key user.id so
                  // in-app + push fire alongside email.
                  to: {
                    subscriberId: owner.user.id,
                    email: owner.user.email,
                  },
                  payload: {
                    email: owner.user.email,
                    ownerName: owner.user.fullName ?? "Operator Owner",
                    companyName: company.name,
                    transactionId: input.transactionId,
                    amountXOF: amountVal,
                    status:
                      input.action === "FORCE_COMPLETE" ? "SETTLED" : "FAILED",
                    reason: input.reason,
                  },
                  transactionId: `operator-withdrawal-resolved-${input.transactionId}-${owner.user.id}`,
                })
                .catch(() => {});
            }
          }
        } catch (err) {
          console.error("Failed to trigger operator-withdrawal-resolved:", err);
        }
      }

      if (input.action === "FORCE_FAIL" && novu && company) {
        const admins = await ctx.prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { email: true, id: true },
        });
        if (admins.length > 0) {
          try {
            const amountVal = toSafeDisplayNumber(operatorEntry?.amount);
            for (const admin of admins) {
              await novu
                .trigger({
                  workflowId: "admin-payout-failed",
                  // Phase 08 (F-NF-03) — platform admins are account holders:
                  // key user.id (same scheme as operator.ts treasury alert).
                  to: {
                    subscriberId: admin.id,
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
                  transactionId: `admin-payout-failed-${input.transactionId}-${admin.id}`,
                })
                .catch(() => {});
            }
          } catch (err) {
            console.error("Failed to trigger admin-payout-failed:", err);
          }
        }
      }

      return { success: true };
    }),

  getWithdrawalStats: adminProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "platform:withdrawals:read");
      // Build optional date range filter
      const dateFilter =
        input.from && input.to
          ? {
              createdAt: {
                gte: new Date(input.from),
                lte: new Date(input.to),
              },
            }
          : {};

      // Group by status to get counts (DB-level, never client-side)
      const statusGroups = await ctx.prisma.financialTransaction.groupBy({
        by: ["status"],
        where: { type: "OPERATOR_PAYOUT", ...dateFilter },
        _count: { id: true },
      });

      const countMap = new Map(
        statusGroups.map((g) => [g.status, g._count.id]),
      );

      // Aggregate DEBIT amounts per status from LedgerEntry (operator receivable side)
      const [pendingSum, settledSum, failedSum] = await Promise.all([
        ctx.prisma.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: {
            side: "DEBIT",
            account: { accountClass: "OPERATOR_RECEIVABLE" },
            transaction: {
              type: "OPERATOR_PAYOUT",
              status: { in: ["CREATED", "POSTED"] },
              ...dateFilter,
            },
          },
        }),
        ctx.prisma.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: {
            side: "DEBIT",
            account: { accountClass: "OPERATOR_RECEIVABLE" },
            transaction: {
              type: "OPERATOR_PAYOUT",
              status: "SETTLED",
              ...dateFilter,
            },
          },
        }),
        ctx.prisma.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: {
            side: "DEBIT",
            account: { accountClass: "OPERATOR_RECEIVABLE" },
            transaction: {
              type: "OPERATOR_PAYOUT",
              status: { in: ["FAILED", "REVERSED"] },
              ...dateFilter,
            },
          },
        }),
      ]);

      return {
        pendingCount:
          (countMap.get("CREATED") ?? 0) + (countMap.get("POSTED") ?? 0),
        pendingVolumeXOF: toSafeDisplayNumber(pendingSum._sum.amount),
        settledCount: countMap.get("SETTLED") ?? 0,
        settledVolumeXOF: toSafeDisplayNumber(settledSum._sum.amount),
        failedCount:
          (countMap.get("FAILED") ?? 0) + (countMap.get("REVERSED") ?? 0),
        failedVolumeXOF: toSafeDisplayNumber(failedSum._sum.amount),
        totalCount: statusGroups.reduce((s, g) => s + g._count.id, 0),
      };
    }),

  getOnboardingFunnel: adminProcedure.query(async ({ ctx }) => {
    requireAdminPermission(ctx, "companies:read");
    const funnelSteps = await ctx.prisma.operatorOnboarding.groupBy({
      by: ["currentStep"],
      _count: { _all: true },
    });

    const total = await ctx.prisma.operatorOnboarding.count();
    const completed = await ctx.prisma.operatorOnboarding.count({
      where: { completedAt: { not: null } },
    });

    return {
      totalStarted: total,
      totalCompleted: completed,
      steps: funnelSteps.map((step) => ({
        step: step.currentStep,
        count: step._count._all,
      })),
    };
  }),

  // --- BLOG MANAGEMENT ---
  createBlogPostDraft: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().default(""),
        categoryId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:posts:create");
      const baseSlug = slugify(input.title).slice(0, 60);
      const suffix = Math.random().toString(36).slice(2, 8);
      const slug = `${baseSlug}-${suffix}`;

      const wordCount = input.content
        ? input.content.split(/\s+/).filter(Boolean).length
        : 0;
      const readingTime = Math.ceil(wordCount / 200);

      return ctx.prisma.blogPost.create({
        data: {
          title: input.title,
          slug,
          content: input.content,
          authorId: ctx.user.id,
          categoryId: input.categoryId || null,
          wordCount,
          readingTime,
        },
      });
    }),

  updateBlogPost: adminProcedure
    .input(
      z.object({
        id: z.string(),
        // Core content
        title: z.string().min(1).max(200).optional(),
        slug: z
          .string()
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug must be lowercase letters, numbers, and hyphens only",
          )
          .optional(),
        content: z.string().optional(),
        excerpt: z.string().max(500).nullish(),
        // Status & scheduling
        status: z
          .enum(["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"])
          .optional(),
        scheduledFor: z.date().nullish(),
        // Media
        coverImage: z.string().url().nullish(),
        coverImageAlt: z.string().max(200).nullish(),
        coverImageCredit: z.string().max(200).nullish(),
        ogImage: z.string().url().nullish(),
        // Author overrides
        displayAuthorName: z.string().max(100).nullish(),
        displayAuthorBio: z.string().max(500).nullish(),
        displayAuthorAvatar: z.string().url().nullish(),
        // Category & Tags
        categoryId: z.string().nullish(),
        tagIds: z.array(z.string()).optional(),
        // Feature flags
        featured: z.boolean().optional(),
        featuredOrder: z.number().int().nullish(),
        allowIndex: z.boolean().optional(),
        allowComments: z.boolean().optional(),
        // SEO
        seoTitle: z.string().max(70).nullish(),
        seoDescription: z.string().max(160).nullish(),
        canonicalUrl: z.string().url().nullish(),
        twitterTitle: z.string().max(70).nullish(),
        twitterDescription: z.string().max(200).nullish(),
        twitterImage: z.string().url().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:posts:update");
      const { id, tagIds, status, ...rest } = input;

      // Fetch current state to drive conditional logic
      const existing = await ctx.prisma.blogPost.findUniqueOrThrow({
        where: { id },
        select: { status: true, publishedAt: true, slug: true },
      });

      const publishedAt =
        status === "PUBLISHED" &&
        existing.status !== "PUBLISHED" &&
        !existing.publishedAt
          ? new Date()
          : undefined;

      const wordCount =
        rest.content !== undefined
          ? rest.content.split(/\s+/).filter(Boolean).length
          : undefined;
      const readingTime =
        wordCount !== undefined ? Math.ceil(wordCount / 200) : undefined;

      // Run update + optional revision + optional slug history in one transaction
      const [updatedPost] = await ctx.prisma.$transaction([
        // 1. Update the post itself
        ctx.prisma.blogPost.update({
          where: { id },
          data: {
            ...rest,
            ...(status !== undefined && { status }),
            ...(publishedAt !== undefined && { publishedAt }),
            ...(tagIds !== undefined && {
              tags: { set: tagIds.map((tid) => ({ id: tid })) },
            }),
            ...(wordCount !== undefined && { wordCount, readingTime }),
            // Handle optional nullable fields explicitly to satisfy exactOptionalPropertyTypes
            ...("categoryId" in rest && {
              categoryId: rest.categoryId ?? null,
            }),
          } as any,
          include: { category: true, tags: true },
        }),

        // 2. Snapshot revision whenever content changes
        ...(rest.content !== undefined
          ? [
              ctx.prisma.blogRevision.create({
                data: {
                  postId: id,
                  content: rest.content,
                  changedById: ctx.user.id,
                },
              }),
            ]
          : []),

        // 3. Record slug history whenever the slug changes
        ...(rest.slug && rest.slug !== existing.slug
          ? [
              ctx.prisma.blogSlugHistory.upsert({
                where: { oldSlug: existing.slug },
                create: { oldSlug: existing.slug, newSlug: rest.slug },
                update: { newSlug: rest.slug },
              }),
            ]
          : []),
      ]);

      return updatedPost;
    }),

  listBlogPosts: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:posts:read");
      const where: any = { deletedAt: null };

      if (input.status) {
        where.status = input.status;
      }

      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { excerpt: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.prisma.blogPost.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            author: { select: { fullName: true, email: true } },
            category: { select: { name: true } },
          },
        }),
        ctx.prisma.blogPost.count({ where }),
      ]);

      return { items, total };
    }),

  getBlogPostById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:posts:read");
      const post = await ctx.prisma.blogPost.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { fullName: true, email: true, image: true } },
          category: true,
          tags: true,
        },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  listBlogCategories: adminProcedure.query(async ({ ctx }) => {
    requireAdminPermission(ctx, "content:categories:manage");
    return ctx.prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        parent: { select: { name: true } },
      },
    });
  }),

  createBlogCategory: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        parentId: z.string().nullish(),
        description: z.string().max(200).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:categories:manage");
      const slug = slugify(input.name);

      return ctx.prisma.blogCategory.create({
        data: {
          name: input.name,
          slug,
          parentId: input.parentId || null,
          description: input.description || null,
        },
      });
    }),

  updateBlogCategory: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(50).optional(),
        parentId: z.string().nullish(),
        description: z.string().max(200).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:categories:manage");
      const { id, name, parentId, description } = input;
      const data: any = {};

      if (name !== undefined) {
        data.name = name;
        data.slug = slugify(name);
      }

      if (parentId !== undefined) {
        const targetParentId = parentId || null;
        if (targetParentId) {
          if (targetParentId === id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A category cannot be its own parent.",
            });
          }

          // Traverse parents upward to check for cycles
          let currentParentId: string | null = targetParentId;
          while (currentParentId) {
            const parentCat: { parentId: string | null } | null =
              await ctx.prisma.blogCategory.findUnique({
                where: { id: currentParentId },
                select: { parentId: true },
              });
            if (parentCat?.parentId === id) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Circular dependency detected: a category cannot be parented to its own descendant.",
              });
            }
            currentParentId = parentCat?.parentId || null;
          }
        }
        data.parentId = targetParentId;
      }

      if (description !== undefined) {
        data.description = description || null;
      }

      return ctx.prisma.blogCategory.update({
        where: { id },
        data,
      });
    }),

  deleteBlogCategory: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:categories:manage");
      const postsCount = await ctx.prisma.blogPost.count({
        where: { categoryId: input.id },
      });
      if (postsCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Cannot delete category: ${postsCount} blog post(s) are using this category. Reassign them first.`,
        });
      }
      return ctx.prisma.blogCategory.delete({
        where: { id: input.id },
      });
    }),

  listBlogTags: adminProcedure.query(async ({ ctx }) => {
    requireAdminPermission(ctx, "content:tags:manage");
    return ctx.prisma.blogTag.findMany({
      orderBy: { name: "asc" },
    });
  }),

  createBlogTag: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(30),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:tags:manage");
      const slug = slugify(input.name);

      return ctx.prisma.blogTag.create({
        data: {
          name: input.name,
          slug,
        },
      });
    }),

  updateBlogTag: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(30),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:tags:manage");
      const slug = slugify(input.name);

      return ctx.prisma.blogTag.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug,
        },
      });
    }),

  deleteBlogTag: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:tags:manage");
      const postsCount = await ctx.prisma.blogPost.count({
        where: { tags: { some: { id: input.id } } },
      });
      if (postsCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Cannot delete tag: ${postsCount} blog post(s) are tagged with this tag.`,
        });
      }
      return ctx.prisma.blogTag.delete({
        where: { id: input.id },
      });
    }),

  getBlogAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:analytics:read");
      const periodDays: Record<string, number> = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
      };
      const since =
        input.period === "all"
          ? undefined
          : new Date(Date.now() - periodDays[input.period]! * 86_400_000);

      const eventWhere = since ? { createdAt: { gte: since } } : {};

      const [
        viewsAgg,
        publishedCount,
        draftCount,
        shareCount,
        ctaCount,
        r25,
        r50,
        r75,
        r100,
        topPosts,
        viewEvents,
      ] = await Promise.all([
        ctx.prisma.blogPost.aggregate({
          _sum: { viewCount: true },
          where: { deletedAt: null },
        }),
        ctx.prisma.blogPost.count({
          where: { status: "PUBLISHED", deletedAt: null },
        }),
        ctx.prisma.blogPost.count({
          where: { status: "DRAFT", deletedAt: null },
        }),
        ctx.prisma.blogEvent.count({
          where: { ...eventWhere, eventType: "SHARE" },
        }),
        ctx.prisma.blogEvent.count({
          where: { ...eventWhere, eventType: "CTA_CLICK" },
        }),
        ctx.prisma.blogEvent.count({
          where: { ...eventWhere, eventType: "READ_25" },
        }),
        ctx.prisma.blogEvent.count({
          where: { ...eventWhere, eventType: "READ_50" },
        }),
        ctx.prisma.blogEvent.count({
          where: { ...eventWhere, eventType: "READ_75" },
        }),
        ctx.prisma.blogEvent.count({
          where: { ...eventWhere, eventType: "READ_100" },
        }),
        ctx.prisma.blogPost.findMany({
          where: { deletedAt: null },
          orderBy: { viewCount: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            viewCount: true,
            publishedAt: true,
            featured: true,
            category: { select: { name: true } },
            _count: { select: { events: { where: { eventType: "SHARE" } } } },
          },
        }),
        ctx.prisma.blogEvent.findMany({
          where: { ...eventWhere, eventType: "VIEW" },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
      ]);

      // Group VIEW events by calendar day (YYYY-MM-DD)
      const dayMap = new Map<string, number>();
      for (const e of viewEvents) {
        const key = e.createdAt.toISOString().slice(0, 10);
        dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
      }
      const dailyViews = Array.from(dayMap.entries())
        .map(([date, views]) => ({ date, views }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        kpis: {
          totalViews: viewsAgg._sum.viewCount ?? 0,
          publishedCount,
          draftCount,
          shareCount,
          ctaCount,
        },
        dailyViews,
        readDepth: [
          { stage: "25%", count: r25 },
          { stage: "50%", count: r50 },
          { stage: "75%", count: r75 },
          { stage: "100%", count: r100 },
        ],
        topPosts,
      };
    }),

  listBlogRedirects: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:redirects:manage");
      const where: any = {};
      if (input.search) {
        where.OR = [
          { source: { contains: input.search, mode: "insensitive" } },
          { destination: { contains: input.search, mode: "insensitive" } },
        ];
      }
      const [items, total] = await Promise.all([
        ctx.prisma.blogRedirect.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: (input.page - 1) * input.limit,
        }),
        ctx.prisma.blogRedirect.count({ where }),
      ]);
      return { items, total };
    }),

  createBlogRedirect: adminProcedure
    .input(
      z.object({
        source: z.string().min(1),
        destination: z.string().min(1),
        type: z.number().default(301),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:redirects:manage");
      return ctx.prisma.blogRedirect.create({ data: input });
    }),

  updateBlogRedirect: adminProcedure
    .input(
      z.object({
        id: z.string(),
        source: z.string().min(1),
        destination: z.string().min(1),
        type: z.number().default(301),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:redirects:manage");
      const { id, ...data } = input;
      return ctx.prisma.blogRedirect.update({ where: { id }, data });
    }),

  deleteBlogRedirect: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:redirects:manage");
      return ctx.prisma.blogRedirect.delete({ where: { id: input.id } });
    }),

  // --- PROMO BANNERS ---
  listBanners: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:posts:read");
      const where: any = {};
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { subtitle: { contains: input.search, mode: "insensitive" } },
        ];
      }
      const [items, total] = await Promise.all([
        ctx.prisma.promoBanner.findMany({
          where,
          orderBy: { sortOrder: "asc" },
          take: input.limit,
          skip: (input.page - 1) * input.limit,
        }),
        ctx.prisma.promoBanner.count({ where }),
      ]);
      return { items, total };
    }),

  createBanner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        subtitle: z.string().max(200).nullish(),
        badge: z.string().max(30).nullish(),
        imageUrl: z.string().url(),
        actionType: z
          .enum(["SEARCH", "APP_SCREEN", "BLOG_ARTICLE", "EXTERNAL_URL"])
          .default("SEARCH"),
        actionPayload: z.any().optional(),
        gradientColors: z.array(z.string()).default(["#ee237c", "#9333ea"]),
        isActive: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
        startDate: z.date().nullish(),
        endDate: z.date().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:posts:create");
      return ctx.prisma.promoBanner.create({
        data: input as any,
      });
    }),

  updateBanner: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(100).optional(),
        subtitle: z.string().max(200).nullish(),
        badge: z.string().max(30).nullish(),
        imageUrl: z.string().url().optional(),
        actionType: z
          .enum(["SEARCH", "APP_SCREEN", "BLOG_ARTICLE", "EXTERNAL_URL"])
          .optional(),
        actionPayload: z.any().optional(),
        gradientColors: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        startDate: z.date().nullish(),
        endDate: z.date().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:posts:update");
      const { id, ...data } = input;
      return ctx.prisma.promoBanner.update({
        where: { id },
        data: data as any,
      });
    }),

  deleteBanner: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "content:posts:update");
      return ctx.prisma.promoBanner.delete({
        where: { id: input.id },
      });
    }),

  listDispatchTrips: adminProcedure
    .input(
      z.object({
        status: z
          .preprocess(
            (val) => (typeof val === "string" ? val.toUpperCase() : val),
            z.union([tripStatusEnum, z.literal("ALL"), z.literal("ACTIVE")]),
          )
          .optional(),
        companyId: z.string().nullable().optional(),
        from: z.string().nullable().optional(),
        to: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "platform:trips:read");
      const filters: any = {};
      filters.archivedAt = null;

      if (input?.status && input.status !== "ALL") {
        if (input.status === "ACTIVE") {
          filters.status = {
            in: ["SCHEDULED", "BOARDING", "DEPARTED", "DELAYED"],
          };
        } else {
          filters.status = input.status;
        }
      }

      if (input?.companyId) {
        filters.companyId = input.companyId;
      }

      if (input?.from || input?.to) {
        filters.departureDate = {};
        if (input?.from) {
          filters.departureDate.gte = new Date(input.from);
        }
        if (input?.to) {
          filters.departureDate.lte = new Date(input.to);
        }
      }

      return ctx.prisma.trip.findMany({
        where: filters,
        include: {
          company: {
            select: { name: true, logoUrl: true },
          },
          bus: {
            include: { busType: true },
          },
          schedule: {
            include: {
              route: {
                include: {
                  originTerminal: { include: { cityRelation: true } },
                  destTerminal: { include: { cityRelation: true } },
                },
              },
            },
          },
          seats: {
            include: { seat: true },
          },
          _count: {
            select: {
              bookings: {
                where: {
                  OR: [
                    { status: "CONFIRMED" },
                    {
                      status: "PENDING_PAYMENT",
                      holdExpiresAt: { gt: new Date() },
                    },
                  ],
                },
              },
            },
          },
        },
        orderBy: { departureDate: "asc" },
      });
    }),

  getDispatchTrip: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "platform:trips:read");
      const trip = await ctx.prisma.trip.findFirst({
        where: { id: input.id, archivedAt: null },
        include: {
          company: true,
          bus: {
            include: { busType: true },
          },
          schedule: {
            include: {
              route: {
                include: {
                  originTerminal: { include: { cityRelation: true } },
                  destTerminal: { include: { cityRelation: true } },
                  waypoints: { orderBy: { stopOrder: "asc" } },
                },
              },
            },
          },
          tripStops: {
            orderBy: { stopOrder: "asc" },
            include: {
              terminal: { include: { cityRelation: true } },
            },
          },
          seats: {
            include: { seat: true },
            orderBy: [
              { seat: { deck: "asc" } },
              { seat: { row: "asc" } },
              { seat: { col: "asc" } },
            ],
          },
          bookings: {
            include: {
              seat: true,
              originTripStop: {
                include: {
                  terminal: { include: { cityRelation: true } },
                },
              },
              destinationTripStop: {
                include: {
                  terminal: { include: { cityRelation: true } },
                },
              },
            },
            where: {
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      return trip;
    }),

  getTripAudit: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "platform:trips:read");
      const trip = await ctx.prisma.trip.findFirst({
        where: { id: input.id, archivedAt: null },
        include: {
          company: true,
          bus: {
            include: { busType: true },
          },
          schedule: {
            include: {
              route: {
                include: {
                  originTerminal: { include: { cityRelation: true } },
                  destTerminal: { include: { cityRelation: true } },
                  waypoints: { orderBy: { stopOrder: "asc" } },
                },
              },
            },
          },
          tripStops: {
            orderBy: { stopOrder: "asc" },
            include: {
              terminal: { include: { cityRelation: true } },
            },
          },
          seats: {
            include: { seat: true },
            orderBy: [
              { seat: { deck: "asc" } },
              { seat: { row: "asc" } },
              { seat: { col: "asc" } },
            ],
          },
          bookings: {
            include: {
              seat: true,
              originTripStop: {
                include: {
                  terminal: { include: { cityRelation: true } },
                },
              },
              destinationTripStop: {
                include: {
                  terminal: { include: { cityRelation: true } },
                },
              },
              holdGroup: {
                include: {
                  payment: true,
                },
              },
              review: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      return trip;
    }),

  listRoutes: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(15),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "platform:routes:read");
      const where: any = {};
      if (input.status && input.status !== "All") {
        where.status = input.status;
      }
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          {
            company: { name: { contains: input.search, mode: "insensitive" } },
          },
          {
            originTerminal: {
              cityRelation: {
                name: { contains: input.search, mode: "insensitive" },
              },
            },
          },
          {
            destTerminal: {
              cityRelation: {
                name: { contains: input.search, mode: "insensitive" },
              },
            },
          },
        ];
      }

      const offset = (input.page - 1) * input.pageSize;

      const [items, total] = await Promise.all([
        ctx.prisma.route.findMany({
          where,
          orderBy: { name: "asc" },
          take: input.pageSize,
          skip: offset,
          include: {
            originTerminal: { include: { cityRelation: true } },
            destTerminal: { include: { cityRelation: true } },
            company: { select: { name: true, logoUrl: true, slug: true } },
            _count: {
              select: { waypoints: true },
            },
          },
        }),
        ctx.prisma.route.count({ where }),
      ]);

      return { items, total };
    }),

  getRoute: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "platform:routes:read");
      const route = await ctx.prisma.route.findUnique({
        where: { id: input.id },
        include: {
          originTerminal: { include: { cityRelation: true } },
          destTerminal: { include: { cityRelation: true } },
          company: { select: { name: true, logoUrl: true, slug: true } },
          waypoints: {
            include: {
              terminal: { include: { cityRelation: true } },
            },
            orderBy: { stopOrder: "asc" },
          },
        },
      });

      if (!route) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
      }

      return route;
    }),

  listActivityLogs: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(0).default(0),
        limit: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        channels: z.array(z.string()).optional(),
        templates: z.array(z.string()).optional(),
        subscriberIds: z.array(z.string()).optional(),
        transactionId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "audit:read");
      const novu = getNovuClient();
      if (!novu) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "NOVU_SECRET_KEY is not configured",
        });
      }

      let templateIds: string[] | undefined;
      if (input.templates?.length) {
        const workflows = await novu.workflows.list({ limit: 100 });
        const workflowsData =
          (workflows as any).result?.data || (workflows as any).data || [];

        const matchingWorkflows = workflowsData.filter(
          (w: any) =>
            input.templates!.includes(w.identifier) ||
            input.templates!.includes(w.name),
        );
        templateIds = matchingWorkflows.map((w: any) => w._id || w.id);

        if (templateIds && templateIds.length === 0) {
          return {
            items: [],
            hasMore: false,
            page: input.page,
            limit: input.limit,
          };
        }
      }

      const response = await novu.notifications.list({
        page: input.page,
        limit: input.limit,
        ...(input.search ? { search: input.search } : {}),
        ...(input.channels?.length ? { channels: input.channels as any } : {}),
        ...(templateIds && templateIds.length > 0
          ? { templates: templateIds as string[] }
          : {}),
        ...(input.subscriberIds?.length
          ? { subscriberIds: input.subscriberIds }
          : {}),
        ...(input.transactionId ? { transactionId: input.transactionId } : {}),
      });

      const result = (response as any).result || (response as any);

      return {
        items: result.data ?? [],
        hasMore: result.hasMore ?? false,
        page: input.page,
        limit: input.limit,
      };
    }),

  listBankAccessLogs: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(0).default(0),
        limit: z.number().int().min(1).max(100).default(20),
        companyId: z.string().optional(),
        userId: z.string().optional(),
        action: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "audit:bank-access:read");
      const { page, limit, companyId, userId, action } = input;
      const skip = page * limit;

      const where = {
        ...(companyId ? { companyId } : {}),
        ...(userId ? { userId } : {}),
        ...(action ? { action } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.bankAccessLog.findMany({
          where,
          include: {
            company: { select: { id: true, name: true, slug: true } },
            user: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.prisma.bankAccessLog.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  listWebhookEvents: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(0).default(0),
        limit: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        status: z.string().optional(),
        provider: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "audit:webhooks:read");
      const { page, limit, search, status, provider } = input;
      const skip = page * limit;

      const where: any = {};

      if (provider && provider !== "All") {
        where.provider = { equals: provider, mode: "insensitive" };
      }

      if (search) {
        where.OR = [
          { reference: { contains: search, mode: "insensitive" } },
          { idempotencyKey: { contains: search, mode: "insensitive" } },
        ];
      }

      if (status && status !== "All") {
        if (status === "Processed") {
          where.processedAt = { not: null };
          where.error = null;
        } else if (status === "Failed") {
          where.error = { not: null };
        } else if (status === "Pending") {
          where.processedAt = null;
          where.error = null;
        }
      }

      const [items, total] = await Promise.all([
        ctx.prisma.webhookEvent.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.prisma.webhookEvent.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getDashboardStats: adminProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "platform:financials:read");
      const from = new Date(input.from);
      const to = new Date(input.to);
      const windowMs = to.getTime() - from.getTime();
      const prevFrom = new Date(from.getTime() - windowMs);
      const prevTo = from;

      // Pre-fetch the real platform revenue account IDs.
      // "PLATFORM_FEES" is a virtual alias used in the ledger viewer — it does NOT
      // exist as a database column value. The actual accounts are COMMISSION_REVENUE
      // and CONVENIENCE_FEE_REVENUE, provisioned by FinancialAccountService.
      const accountService = new FinancialAccountService(ctx.prisma);
      const [platformCommAcct, platformFeeAcct] = await Promise.all([
        accountService.getPlatformCommissionRevenueAccount(),
        accountService.getPlatformConvenienceFeeRevenueAccount(),
      ]);
      const platformAccountIds = [platformCommAcct.id, platformFeeAcct.id];

      // 1. Period Ledgers
      const [
        revenueCurrent,
        revenuePrev,
        operatorEarningsCurrent,
        operatorEarningsPrev,
      ] = await Promise.all([
        ctx.prisma.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: {
            side: "CREDIT",
            status: "POSTED",
            accountId: { in: platformAccountIds },
            effectiveAt: { gte: from, lte: to },
          },
        }),
        ctx.prisma.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: {
            side: "CREDIT",
            status: "POSTED",
            accountId: { in: platformAccountIds },
            effectiveAt: { gte: prevFrom, lt: prevTo },
          },
        }),
        ctx.prisma.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: {
            side: "CREDIT",
            status: "POSTED",
            transaction: { type: "BOOKING" },
            account: { accountClass: "OPERATOR_RECEIVABLE" },
            effectiveAt: { gte: from, lte: to },
          },
        }),
        ctx.prisma.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: {
            side: "CREDIT",
            status: "POSTED",
            transaction: { type: "BOOKING" },
            account: { accountClass: "OPERATOR_RECEIVABLE" },
            effectiveAt: { gte: prevFrom, lt: prevTo },
          },
        }),
      ]);

      // 2. Absolute Balances (Treasury View)
      const [systemAssetAcc, operatorLiabilitySum, passengerWalletSum] =
        await Promise.all([
          ctx.prisma.financialAccount.findFirst({
            where: {
              accountCategory: "ASSET",
              accountClass: "PAYSTACK_CLEARING",
            },
          }),
          ctx.prisma.financialAccount.aggregate({
            _sum: { postedBalance: true },
            where: {
              accountCategory: "LIABILITY",
              accountClass: "OPERATOR_RECEIVABLE",
            },
          }),
          ctx.prisma.financialAccount.aggregate({
            _sum: { postedBalance: true },
            where: {
              accountCategory: "LIABILITY",
              accountClass: "PASSENGER_WALLET",
            },
          }),
        ]);

      // 3. Platform Operational Stats
      const [
        travelersCount,
        operatorsCount,
        pendingOperatorsCount,
        activeTripsCount,
        bookingsCurrent,
        bookingsPrev,
      ] = await Promise.all([
        ctx.prisma.user.count({ where: { role: "TRAVELER" } }),
        ctx.prisma.company.count(),
        ctx.prisma.company.count({ where: { status: "PENDING_VERIFICATION" } }),
        ctx.prisma.trip.count({
          where: {
            status: { in: ["BOARDING", "DEPARTED", "DELAYED"] },
            archivedAt: null,
          },
        }),
        ctx.prisma.booking.count({
          where: { status: "CONFIRMED", createdAt: { gte: from, lte: to } },
        }),
        ctx.prisma.booking.count({
          where: {
            status: "CONFIRMED",
            createdAt: { gte: prevFrom, lt: prevTo },
          },
        }),
      ]);

      // Calculate Period GMV (Platform Revenue + Operator Earnings from Bookings)
      const currentRevenue = toSafeDisplayNumber(revenueCurrent._sum.amount);
      const prevRevenue = toSafeDisplayNumber(revenuePrev._sum.amount);
      const currentOperatorEarnings = toSafeDisplayNumber(
        operatorEarningsCurrent._sum.amount,
      );
      const prevOperatorEarnings = toSafeDisplayNumber(
        operatorEarningsPrev._sum.amount,
      );

      const currentGMV = currentRevenue + currentOperatorEarnings;
      const previousGMV = prevRevenue + prevOperatorEarnings;

      // 4. Trend Data for Chart
      const recentRevenueEntries = await ctx.prisma.ledgerEntry.findMany({
        where: {
          side: "CREDIT",
          status: "POSTED",
          accountId: { in: platformAccountIds },
          effectiveAt: { gte: from, lte: to },
        },
        select: { amount: true, effectiveAt: true },
        orderBy: { effectiveAt: "asc" },
      });

      const recentEarningsEntries = await ctx.prisma.ledgerEntry.findMany({
        where: {
          side: "CREDIT",
          status: "POSTED",
          transaction: { type: "BOOKING" },
          account: { accountClass: "OPERATOR_RECEIVABLE" },
          effectiveAt: { gte: from, lte: to },
        },
        select: { amount: true, effectiveAt: true },
        orderBy: { effectiveAt: "asc" },
      });

      const dayCount = Math.max(1, Math.ceil(windowMs / (24 * 60 * 60 * 1000)));
      const trendMap: Record<string, { revenue: number; operator: number }> =
        {};

      for (let i = 0; i < dayCount; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        trendMap[d.toISOString().slice(0, 10)] = { revenue: 0, operator: 0 };
      }

      for (const entry of recentRevenueEntries) {
        const key = entry.effectiveAt.toISOString().slice(0, 10);
        const mapEntry = trendMap[key];
        if (mapEntry) mapEntry.revenue += toSafeDisplayNumber(entry.amount);
      }
      for (const entry of recentEarningsEntries) {
        const key = entry.effectiveAt.toISOString().slice(0, 10);
        const mapEntry = trendMap[key];
        if (mapEntry) mapEntry.operator += toSafeDisplayNumber(entry.amount);
      }

      const revenueTrend = Object.entries(trendMap).map(([date, data]) => ({
        date,
        gmv: data.revenue + data.operator,
      }));

      const gmvDeltaPct =
        previousGMV === 0
          ? null
          : Math.round(((currentGMV - previousGMV) / previousGMV) * 100);

      const bookingDeltaPct =
        bookingsPrev === 0
          ? null
          : Math.round(((bookingsCurrent - bookingsPrev) / bookingsPrev) * 100);

      return {
        // Core KPIs
        gmv: currentGMV,
        gmvDeltaPct,
        commission: currentRevenue,
        bookingsCurrent,
        bookingDeltaPct,

        // Treasury Balances
        systemLiquidity: toSafeDisplayNumber(systemAssetAcc?.postedBalance),
        operatorPayables: toSafeDisplayNumber(
          operatorLiabilitySum._sum.postedBalance,
        ),
        passengerWallets: toSafeDisplayNumber(
          passengerWalletSum._sum.postedBalance,
        ),

        // Platform Health
        travelersCount,
        operatorsCount,
        pendingOperatorsCount,
        activeTripsCount,

        // Chart
        revenueTrend,
      };
    }),

  getRecentActivity: adminProcedure.query(async ({ ctx }) => {
    requireAdminPermission(ctx, "platform:financials:read");
    const [recentCompanies, recentBookings] = await Promise.all([
      ctx.prisma.company.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
        },
      }),
      ctx.prisma.booking.findMany({
        where: { status: "CONFIRMED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          bookingReference: true,
          passengerName: true,
          farePaid: true,
          createdAt: true,
          company: { select: { name: true } },
        },
      }),
    ]);
    return { recentCompanies, recentBookings };
  }),

  listDriversForVerification: adminProcedure
    .input(adminListDriversForVerificationSchema)
    .query(async ({ ctx, input }) => {
      // Phase 25 (F-OP-09) — hub visibility is permission-gated.
      requireAdminPermission(ctx, "drivers:verify.read");

      const where: any = {};

      if (input.status && input.status !== "ALL") {
        where.verificationStatus = input.status;
      }

      if (input.licenseCategory) {
        where.licenseCategory = input.licenseCategory;
      }

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        where.OR = [
          { licenseNumber: { contains: searchLower, mode: "insensitive" } },
          {
            user: { fullName: { contains: searchLower, mode: "insensitive" } },
          },
          {
            user: {
              phoneNumber: { contains: searchLower, mode: "insensitive" },
            },
          },
          { user: { email: { contains: searchLower, mode: "insensitive" } } },
        ];
      }

      const [total, drivers, pendingCount, verifiedCount, rejectedCount] =
        await Promise.all([
          ctx.prisma.driverProfile.count({ where }),
          ctx.prisma.driverProfile.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                  email: true,
                  image: true,
                  createdAt: true,
                },
              },
              companyAffiliations: {
                include: {
                  company: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
              verifiedBy: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: input.limit,
            skip: input.offset,
          }),
          ctx.prisma.driverProfile.count({
            where: { verificationStatus: "PENDING" },
          }),
          ctx.prisma.driverProfile.count({
            where: { verificationStatus: "VERIFIED" },
          }),
          ctx.prisma.driverProfile.count({
            where: { verificationStatus: "REJECTED" },
          }),
        ]);

      // Phase 15 ride-along (2026-08-25) — compliance docs are PRIVATE
      // storage keys since the Phase-15 pipeline; swap them for short-lived
      // presigned GETs exactly like drivers.getDriver does, so admin dossiers
      // render real documents instead of "missing" placeholders. Legacy
      // absolute URLs pass through untouched; a failed presign degrades to
      // null (placeholder) rather than blocking the hub.
      const presignDoc = async (
        purpose:
          | "driver-license-front"
          | "driver-license-back"
          | "driver-medical-doc",
        value: string | null,
      ): Promise<string | null> => {
        if (!value || !value.startsWith("documents/")) return value;
        try {
          const { downloadUrl } = await createPresignedDownload({
            purpose,
            objectKey: value,
          });
          return downloadUrl;
        } catch {
          return null;
        }
      };

      const driversWithDossiers = await Promise.all(
        drivers.map(async (d: any) => ({
          ...d,
          licenseFrontUrl: await presignDoc(
            "driver-license-front",
            d.licenseFrontUrl ?? null,
          ),
          licenseBackUrl: await presignDoc(
            "driver-license-back",
            d.licenseBackUrl ?? null,
          ),
          medicalDocUrl: await presignDoc(
            "driver-medical-doc",
            d.medicalDocUrl ?? null,
          ),
        })),
      );

      return {
        total,
        drivers: driversWithDossiers,
        counts: {
          pending: pendingCount,
          verified: verifiedCount,
          rejected: rejectedCount,
        },
      };
    }),

  verifyDriver: adminProcedure
    .input(adminVerifyDriverSchema)
    .mutation(async ({ ctx, input }) => {
      // Phase 25 (F-OP-09) — platform-wide verification flips are governed:
      // permission-gated, activity-logged, and the DRIVER is notified (the
      // verification dialog always claimed "Displayed to Driver" — now true).
      requireAdminPermission(ctx, "drivers:verify.manage");

      const driver = await ctx.prisma.driverProfile.findUnique({
        where: { id: input.driverProfileId },
        include: { user: true },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found.",
        });
      }

      // Phase 26 (F-OP-16) — same rule as the operator path: APPROVE with
      // zero compliance documents is a rubber stamp. REJECT/SUSPEND remain
      // available for document-less legacy entries.
      if (
        input.action === "APPROVE" &&
        !driver.licenseFrontUrl &&
        !driver.licenseBackUrl &&
        !driver.medicalDocUrl
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Attach at least one compliance document (licence or medical) before approving this driver.",
        });
      }

      let newStatus: any = driver.status;
      let newVerificationStatus: any = driver.verificationStatus;

      if (input.action === "APPROVE") {
        newVerificationStatus = "VERIFIED";
        // Phase 06 (F-DV-04) — re-approval must not stomp a live run: keep
        // the mid-run operational state instead of forcing AVAILABLE.
        newStatus = driver.currentTripId ? driver.status : "AVAILABLE";
      } else if (input.action === "REJECT") {
        newVerificationStatus = "REJECTED";
        newStatus = "OFFLINE";
      } else if (input.action === "SUSPEND") {
        newVerificationStatus = "SUSPENDED";
        newStatus = "SUSPENDED";
      }

      // Phase 06 (F-DV-04) — privilege-removing actions converge the run
      // state atomically with the verification flip: close any open shift,
      // clear currentTripId, park the profile. A suspended driver is no
      // longer stranded ON_TRIP with a ghost bus on the fleet map.
      const updated = await ctx.prisma.$transaction(async (tx) => {
        if (input.action === "REJECT" || input.action === "SUSPEND") {
          await suspendDriverOperationalState(
            tx as any,
            input.driverProfileId,
            newStatus,
          );
        }

        const updated = await tx.driverProfile.update({
          where: { id: input.driverProfileId },
          data: {
            verificationStatus: newVerificationStatus,
            status: newStatus,
            verifiedAt: input.action === "APPROVE" ? new Date() : null,
            verifiedById: input.action === "APPROVE" ? ctx.user.id : null,
            rejectionReason:
              input.action === "REJECT"
                ? (input.rejectionReason ??
                  "Document compliance requirements not met.")
                : null,
          },
          include: {
            user: true,
          },
        });

        // Phase 25 (F-OP-09) — governance trail + durable driver notice ride
        // the SAME transaction as the flip: a rollback can never strand a
        // logged action or a half-sent notice (enqueue-inside-tx pattern).
        await tx.adminStaffActivityLog.create({
          data: {
            userId: ctx.user.id,
            action: `DRIVER_VERIFY_${input.action}`,
            description: `${input.action} driver verification for ${updated.user.fullName ?? input.driverProfileId}${input.rejectionReason ? ` — reason: ${input.rejectionReason}` : ""}`,
            metadata: {
              driverProfileId: input.driverProfileId,
              action: input.action,
              reason: input.rejectionReason ?? null,
            },
            targetUserId: updated.userId,
          },
        });

        if (updated.user) {
          await enqueueDriverVerificationOutcome(tx as never, {
            driverProfileId: input.driverProfileId,
            kind: input.action,
            to: {
              subscriberId: updated.userId,
              ...(updated.user.email ? { email: updated.user.email } : {}),
              ...(updated.user.fullName
                ? { firstName: updated.user.fullName.split(" ")[0] }
                : {}),
            },
            driverName: updated.user.fullName ?? "Driver",
            reason: input.rejectionReason ?? null,
          });
        }

        return updated;
      });

      return { success: true, driver: updated };
    }),

  // ============================================================================
  // PHASE 9 — DRIVER MARKETPLACE STATS (Admin Dashboard Widget)
  // ============================================================================

  getDriverMarketplaceStats: adminProcedure.query(async ({ ctx }) => {
    const [totalVerified, availableForHire, pendingVerification, employed] =
      await Promise.all([
        // Total verified drivers on the platform
        ctx.prisma.driverProfile.count({
          where: { verificationStatus: "VERIFIED" },
        }),
        // Drivers who have opted in to the marketplace
        ctx.prisma.driverServicePreference.count({
          where: {
            isAvailableForHire: true,
            isSuspended: false,
            driverProfile: { verificationStatus: "VERIFIED" },
          },
        }),
        // Drivers awaiting verification review
        ctx.prisma.driverProfile.count({
          where: { verificationStatus: "PENDING" },
        }),
        // Drivers with at least one active affiliation
        ctx.prisma.driverProfile.count({
          where: {
            verificationStatus: "VERIFIED",
            companyAffiliations: {
              some: { isActive: true },
            },
          },
        }),
      ]);

    return { totalVerified, availableForHire, pendingVerification, employed };
  }),

  // ============================================================================
  // PHASE 14 — DRIVER MARKETPLACE ADMIN CONTROLS
  // ============================================================================

  /**
   * Feature / un-feature / suspend / restore a driver's marketplace listing.
   * Suspension requires a reason (schema-enforced), writes an admin activity
   * log entry, and notifies the driver via the durable Outbox.
   */
  setDriverMarketplaceStatus: adminProcedure
    .input(adminSetDriverMarketplaceStatusSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketplace:manage");
      const { driverProfileId, action, reason } = input;

      const pref = await ctx.prisma.driverServicePreference.findUnique({
        where: { driverProfileId },
        include: {
          driverProfile: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      });
      if (!pref) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver has no marketplace profile (preferences not set).",
        });
      }

      const data: { isFeatured?: boolean; isSuspended?: boolean } = {};
      switch (action) {
        case "FEATURE": {
          if (pref.isFeatured) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Driver is already featured.",
            });
          }
          const featuredCount = await ctx.prisma.driverServicePreference.count({
            where: { isFeatured: true, isSuspended: false },
          });
          if (featuredCount >= MAX_FEATURED_DRIVERS) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Featured cap of ${MAX_FEATURED_DRIVERS} reached. Unfeature someone first.`,
            });
          }
          data.isFeatured = true;
          break;
        }
        case "UNFEATURE": {
          if (!pref.isFeatured) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Driver is not currently featured.",
            });
          }
          data.isFeatured = false;
          break;
        }
        case "SUSPEND": {
          if (pref.isSuspended) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Driver is already suspended from the marketplace.",
            });
          }
          // Suspended drivers are excluded from marketplace queries anyway;
          // clearing the flag frees a Featured-cap slot.
          data.isSuspended = true;
          data.isFeatured = false;
          break;
        }
        case "RESTORE": {
          if (!pref.isSuspended) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Driver is not suspended.",
            });
          }
          data.isSuspended = false;
          break;
        }
      }

      const updated = await ctx.prisma.driverServicePreference.update({
        where: { driverProfileId },
        data,
      });

      await ctx.prisma.adminStaffActivityLog.create({
        data: {
          userId: ctx.user.id,
          action: `MARKETPLACE_${action}`,
          description: `${action} marketplace status for ${pref.driverProfile.user.fullName ?? driverProfileId}${reason ? ` — reason: ${reason}` : ""}`,
          metadata: { driverProfileId, action, reason: reason ?? null },
          targetUserId: pref.driverProfile.userId,
        },
      });

      const dUser = pref.driverProfile.user;
      const recipient = {
        subscriberId: dUser.id,
        ...(dUser.email ? { email: dUser.email } : {}),
        ...(dUser.fullName ? { firstName: dUser.fullName.split(" ")[0] } : {}),
      };
      if (action === "FEATURE") {
        await enqueueDriverMarketplaceFeatured(ctx.prisma as never, {
          driverProfileId,
          to: recipient,
        });
      } else if (action === "SUSPEND") {
        await enqueueDriverMarketplaceSuspended(ctx.prisma as never, {
          driverProfileId,
          to: recipient,
          reason: reason!,
        });
      }

      return { success: true, preference: updated };
    }),

  /**
   * Admin listing of ALL verified drivers with marketplace flags — including
   * suspended and off-market ones (unlike the operator-facing query).
   */
  listMarketplaceAdminDrivers: adminProcedure
    .input(adminListMarketplaceDriversSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketplace:read");
      const { search, status, page, limit } = input;
      const skip = (page - 1) * limit;

      const prefFilter =
        status === "AVAILABLE"
          ? { isAvailableForHire: true, isSuspended: false }
          : status === "FEATURED"
            ? { isFeatured: true }
            : status === "SUSPENDED"
              ? { isSuspended: true }
              : status === "OFF_MARKET"
                ? { isAvailableForHire: false }
                : undefined;

      const whereClause: any = {
        verificationStatus: "VERIFIED",
        ...(prefFilter ? { servicePreference: prefFilter } : {}),
        ...(search
          ? {
              OR: [
                {
                  user: {
                    fullName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
                { user: { phoneNumber: { contains: search } } },
                {
                  licenseNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      };

      const [items, total, counts] = await Promise.all([
        ctx.prisma.driverProfile.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            servicePreference: true,
            user: {
              select: {
                id: true,
                fullName: true,
                image: true,
                phoneNumber: true,
              },
            },
            _count: {
              select: { companyAffiliations: { where: { isActive: true } } },
            },
          },
        }),
        ctx.prisma.driverProfile.count({ where: whereClause }),
        Promise.all([
          ctx.prisma.driverServicePreference.count({
            where: { isFeatured: true },
          }),
          ctx.prisma.driverServicePreference.count({
            where: { isSuspended: true },
          }),
        ]),
      ]);

      return {
        items: items.map((d: any) => ({
          id: d.id,
          fullName: d.user.fullName,
          image: d.user.image,
          phoneNumber: d.user.phoneNumber,
          licenseCategory: d.licenseCategory,
          averageRating: d.averageRating,
          totalReviews: d.totalReviews,
          safetyScore: d.safetyScore,
          totalTripsCompleted: d.totalTripsCompleted,
          verificationStatus: d.verificationStatus,
          activeAffiliations: d._count.companyAffiliations,
          preference: d.servicePreference,
          trustBadges: computeTrustBadges({
            averageRating: d.averageRating,
            totalReviews: d.totalReviews,
            safetyScore: d.safetyScore,
            totalTripsCompleted: d.totalTripsCompleted,
          }),
        })),
        total,
        page,
        limit,
        counts: {
          featured: counts[0],
          suspended: counts[1],
        },
      };
    }),

  /**
   * Marketplace health metrics for the admin strip: KPIs + offer funnel +
   * time-to-hire + counter rate + avg first-response hours.
   */
  getMarketplaceHealth: adminProcedure.query(async ({ ctx }) => {
    requireAdminPermission(ctx, "marketplace:read");

    const [base, offerGroups, hireStats, counterStats] = await Promise.all([
      ctx.prisma.$transaction([
        ctx.prisma.driverProfile.count({
          where: { verificationStatus: "VERIFIED" },
        }),
        ctx.prisma.driverServicePreference.count({
          where: {
            isAvailableForHire: true,
            isSuspended: false,
            driverProfile: { verificationStatus: "VERIFIED" },
          },
        }),
        ctx.prisma.driverProfile.count({
          where: { verificationStatus: "PENDING" },
        }),
        ctx.prisma.driverProfile.count({
          where: {
            verificationStatus: "VERIFIED",
            companyAffiliations: { some: { isActive: true } },
          },
        }),
        ctx.prisma.driverServicePreference.count({
          where: { isFeatured: true },
        }),
        ctx.prisma.driverServicePreference.count({
          where: { isSuspended: true },
        }),
      ]),
      ctx.prisma.driverEmploymentOffer.groupBy({
        by: ["status"],
        _count: true,
      }),
      ctx.prisma.$queryRawUnsafe<Array<{ hours: number | null }>>(
        `SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600)::float AS hours
         FROM "driver_employment_offer"
         WHERE "status" = 'ACCEPTED' AND "resolvedAt" IS NOT NULL`,
      ),
      ctx.prisma.$queryRawUnsafe<
        Array<{ countered_offers: number; total_offers: number }>
      >(
        `SELECT
           (SELECT COUNT(DISTINCT "offerId") FROM "driver_offer_event"
             WHERE "eventType" IN ('COUNTERED_BY_DRIVER','COUNTERED_BY_OPERATOR'))::int AS countered_offers,
           (SELECT COUNT(*) FROM "driver_employment_offer")::int AS total_offers`,
      ),
    ]);

    const funnel: Record<string, number> = {};
    for (const g of offerGroups) funnel[g.status] = g._count;

    const responseRows = await ctx.prisma.$queryRawUnsafe<
      Array<{ hours: number | null }>
    >(
      `SELECT AVG(EXTRACT(EPOCH FROM ("respondedAt" - "createdAt")) / 3600)::float AS hours
       FROM "driver_employment_offer"
       WHERE "respondedAt" IS NOT NULL`,
    );

    const totalOffers = Number(counterStats[0]?.total_offers ?? 0);
    const counteredOffers = Number(counterStats[0]?.countered_offers ?? 0);

    return {
      totalVerified: base[0],
      availableForHire: base[1],
      pendingVerification: base[2],
      employed: base[3],
      featured: base[4],
      suspended: base[5],
      maxFeatured: MAX_FEATURED_DRIVERS,
      avgTimeToHireHours: hireStats[0]?.hours ?? null,
      avgFirstResponseHours: responseRows[0]?.hours ?? null,
      counterRatePct:
        totalOffers > 0 ? Math.round((counteredOffers / totalOffers) * 100) : 0,
      funnel: {
        PENDING: funnel["PENDING"] ?? 0,
        COUNTERED: funnel["COUNTERED"] ?? 0,
        ACCEPTED: funnel["ACCEPTED"] ?? 0,
        DECLINED: funnel["DECLINED"] ?? 0,
        EXPIRED: funnel["EXPIRED"] ?? 0,
        WITHDRAWN: funnel["WITHDRAWN"] ?? 0,
      },
    };
  }),

  /**
   * Platform-wide offer audit log with filters and negotiation timelines.
   */
  listAllOffers: adminProcedure
    .input(adminListAllOffersSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "marketplace:read");
      const { status, search, page, limit } = input;
      const skip = (page - 1) * limit;

      const statusWhere =
        status === "ACTIVE"
          ? ["PENDING", "COUNTERED"]
          : status === "ALL"
            ? undefined
            : [status];

      const whereClause: any = {
        ...(statusWhere ? { status: { in: statusWhere } } : {}),
        ...(search
          ? {
              OR: [
                {
                  company: {
                    name: { contains: search, mode: "insensitive" as const },
                  },
                },
                {
                  driverProfile: {
                    user: {
                      fullName: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.driverEmploymentOffer.findMany({
          where: whereClause,
          orderBy: { updatedAt: "desc" as const },
          skip,
          take: limit,
          include: {
            company: {
              select: { id: true, name: true, slug: true, logoUrl: true },
            },
            driverProfile: {
              select: {
                id: true,
                licenseCategory: true,
                user: { select: { id: true, fullName: true, image: true } },
              },
            },
            events: {
              orderBy: { createdAt: "desc" as const },
              take: 10,
              select: {
                eventType: true,
                actorType: true,
                salaryCFA: true,
                note: true,
                createdAt: true,
              },
            },
          },
        }),
        ctx.prisma.driverEmploymentOffer.count({ where: whereClause }),
      ]);

      const now = Date.now();
      return {
        items: items.map((o: any) => ({
          ...o,
          isLive:
            (o.status === "PENDING" || o.status === "COUNTERED") &&
            o.expiresAt.getTime() > now,
        })),
        total,
        page,
        limit,
      };
    }),
});
