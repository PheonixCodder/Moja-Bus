import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Prisma, FinancialAccountService, SnapshotService } from "@moja/db";
import {
  saveOnboardingStepSchema,
  companyStepSchema,
  bankStepSchema,
  documentSchema,
  operatorListBookingsSchema,
  operatorGetBookingSchema,
  operatorCheckInBookingSchema,
  operatorRevenueAnalyticsSchema,
  operatorLedgerFilterSchema,
  logOnboardingEventSchema,
  initSignupSchema,
  verifySignupOtpSchema,
  completeSignupSchema,
  cancelBookingSchema,
} from "@moja/schemas";
import { TERMS_VERSION, PRIVACY_VERSION, COMMISSION_VERSION } from "@/lib/constants/legal";
import crypto from "crypto";
import { getNovuClient } from "@/lib/novu";
import {
  startOfAppCalendarDay,
  addAppCalendarDays,
  getCalendarDateKey,
} from "@/lib/timezone";
import { toSafeDisplayNumber } from "@/lib/money";
import { auth } from "@/lib/auth-server";

import {
  createTRPCRouter,
  operatorCompanyProcedure,
  publicProcedure,
} from "../init";
import { requirePermission, requireAnyPermission, operatorHasPermission } from "@/lib/permissions/authorize";
import { deleteStorageObject } from "@/lib/storage";

import {
  maskBankAccountForClient,
  prepareBankAccountStorage,
  revealBankAccountNumber,
} from "@/lib/bank-account";
import { logBankAccess } from "@/lib/bank-access";
import {
  createWithdrawalChallenge,
  verifyWithdrawalChallenge,
} from "@/lib/withdrawal-2fa";
import { OperatorBookingService } from "@/features/operator/services/operator-booking-service";
import { CancellationService } from "@/features/payments/services/cancellation-service";
import { PaystackProvider } from "@/features/payments/providers/paystack-provider";
import { AccountingEngine } from "@moja/db";
import { operatorSettingsProcedures } from "./operator/settings";

function maskOperatorCompanyBank<T extends any>(
  operator: T,
): T {
  if (!operator || typeof operator !== "object" || !("company" in operator)) {
    return operator;
  }

  const op = operator as any;
  if (!op.company) {
    return operator;
  }

  const updatedCompany = { ...op.company };

  if (op.company.bankAccount) {
    updatedCompany.bankAccount = maskBankAccountForClient(op.company.bankAccount);
  }

  if (op.company.bankAccounts) {
    updatedCompany.bankAccounts = op.company.bankAccounts.map((b: any) =>
      maskBankAccountForClient(b),
    );
  }

  return {
    ...operator,
    company: updatedCompany,
  };
}

export const operatorRouter = createTRPCRouter({
  checkAccountStatus: publicProcedure
    .input(z.object({ identifier: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cleanIdentifier = input.identifier.trim();
      const isEmail = cleanIdentifier.includes("@");

      const user = await ctx.prisma.user.findFirst({
        where: isEmail
          ? { OR: [{ email: cleanIdentifier }, { workEmail: cleanIdentifier }] }
          : { phoneNumber: cleanIdentifier },
      });

      return {
        exists: !!user,
        role: user?.role ?? null,
      };
    }),

  initSignup: publicProcedure
    .input(initSignupSchema)
    .mutation(async ({ ctx, input }) => {
      // Check existing Better Auth user
      const existingUser = await ctx.prisma.user.findFirst({
        where: { OR: [{ email: input.email }, { workEmail: input.email }] },
      });
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      // Generate dummy OTP and hash just to satisfy Prisma schema for now.
      // Better Auth handles the actual OTP generation and verification.
      const dummyOtp = crypto.randomUUID();
      const otpHash = crypto.createHash("sha256").update(dummyOtp).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      const pending = await ctx.prisma.pendingOperatorSignup.upsert({
        where: { email: input.email },
        update: {
          ...input,
          otpHash,
          expiresAt,
          attempts: 0,
        },
        create: {
          ...input,
          otpHash,
          expiresAt,
        },
      });

      return { success: true, email: pending.email };
    }),

  getOnboardingStatus: operatorCompanyProcedure.query(async ({ ctx }) => {
    const STEP_ORDER = ["COMPANY", "DOCUMENTS", "BANK", "PROFILE", "TERMS"] as const;
    const TOTAL_STEPS = STEP_ORDER.length;

    const operator = await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
      include: {
        company: {
          include: {
            documents: { where: { isCurrent: true } },
            bankAccounts: true,
          },
        },
        onboardingProgress: true,
      },
    });

    if (!operator) {
      return {
        onboardingStatus: "NOT_STARTED" as const,
        progress: {
          currentStep: "COMPANY" as const,
          nextStep: "DOCUMENTS" as const,
          completedSteps: [] as string[],
          completedStepCount: 0,
          totalSteps: TOTAL_STEPS,
          percentage: 0,
        },
        operator: null,
        businessReadiness: null,
        // L14: no bank account yet, so payouts are not enabled.
        bankVerified: false,
      };
    }

    // L14: true payout-readiness requires both a verified account AND a
    // Paystack transfer recipient (created during admin KYC approval). This is
    // surfaced so the onboarding UI can show an honest "pending verification"
    // state instead of implying the bank step is fully complete.
    const bankAccounts = operator.company?.bankAccounts ?? [];
    const defaultBank =
      bankAccounts.find((b) => b.isDefault) ?? bankAccounts[0] ?? null;
    const bankVerified = Boolean(
      defaultBank?.isVerified && defaultBank?.paystackTransferRecipientCode,
    );

    const prog = operator.onboardingProgress;
    const completedSteps = (prog?.completedSteps as string[] | null) ?? [];
    const completedStepCount = completedSteps.length;
    const percentage = Math.round((completedStepCount / TOTAL_STEPS) * 100);

    const currentStep =
      STEP_ORDER.find((s) => !completedSteps.includes(s)) ?? "TERMS";
    const currentIdx = STEP_ORDER.indexOf(
      currentStep as (typeof STEP_ORDER)[number],
    );
    const nextStep =
      currentIdx < STEP_ORDER.length - 1 ? STEP_ORDER[currentIdx + 1] : null;

    // Business Readiness — computed from live DB counts
    let businessReadiness = null;
    if (operator.companyId) {
      const [terminals, buses, routes, schedules, trips] = await Promise.all([
        ctx.prisma.companyLocation.count({
          where: { companyId: operator.companyId, isTerminal: true },
        }),
        ctx.prisma.bus.count({ where: { companyId: operator.companyId, deletedAt: null } }),
        ctx.prisma.route.count({
          where: { companyId: operator.companyId, status: "ACTIVE" },
        }),
        ctx.prisma.schedule.count({
          where: { companyId: operator.companyId, isActive: true },
        }),
        ctx.prisma.trip.count({ where: { companyId: operator.companyId } }),
      ]);
      businessReadiness = [
        {
          id: "terminal",
          title: "Add your first terminal",
          completed: terminals > 0,
          href: "/dashboard/operator/terminals",
        },
        {
          id: "bus",
          title: "Add your first bus",
          completed: buses > 0,
          href: "/dashboard/operator/fleet",
        },
        {
          id: "route",
          title: "Create an active route",
          completed: routes > 0,
          href: "/dashboard/operator/routes",
        },
        {
          id: "schedule",
          title: "Set up a schedule",
          completed: schedules > 0,
          href: "/dashboard/operator/schedules",
        },
        {
          id: "trip",
          title: "Publish your first trip",
          completed: trips > 0,
          href: "/dashboard/operator/trips",
        },
      ];
    }

    return {
      onboardingStatus: operator.onboardingStatus,
      progress: {
        currentStep,
        nextStep,
        completedSteps,
        completedStepCount,
        totalSteps: TOTAL_STEPS,
        percentage,
      },
      operator: maskOperatorCompanyBank(operator),
      businessReadiness,
      bankVerified,
    };
  }),

  completeOnboarding: operatorCompanyProcedure.mutation(async ({ ctx }) => {
    const operator = await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
      include: { 
        onboardingProgress: true,
        company: {
          include: {
            bankAccounts: true,
            documents: { where: { supersededAt: null } }
          }
        }
      },
    });

    if (!operator) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Operator profile not found. Complete onboarding steps first.",
      });
    }

    const { company } = operator;
    if (!company.name || !company.registrationNumber || !company.taxId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Company profile details are incomplete. Name, registration number, and tax ID are required.",
      });
    }

    if (!company.bankAccounts || company.bankAccounts.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "At least one bank account must be added before submitting for verification.",
      });
    }

    const requiredDocs = ["BUSINESS_REGISTRATION_CERTIFICATE", "TRANSPORT_OPERATING_PERMIT"];
    const hasRequiredDocs = requiredDocs.every(docType => 
      company.documents.some(d => d.type === docType)
    );

    if (!hasRequiredDocs) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing required compliance documents.",
      });
    }

    const companyId = operator.companyId;
    const operatorId = operator.id;

    await ctx.prisma.$transaction([
      ctx.prisma.operator.update({
        where: { id: operatorId },
        data: { onboardingStatus: "COMPLETED" },
      }),
      ctx.prisma.company.update({
        where: { id: companyId },
        data: { status: "PENDING_VERIFICATION" },
      }),
      ...(operator.onboardingProgress
        ? [
            ctx.prisma.operatorOnboarding.update({
              where: { operatorId },
              data: { completedAt: new Date() },
            }),
          ]
        : []),
    ]);

    // Trigger admin-operator-signup-pending to admins
    const admins = await ctx.prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, id: true },
    });
    if (admins.length > 0) {
      const novu = getNovuClient();
      if (novu) {
        try {
          const companyInfo = await ctx.prisma.company.findUnique({
            where: { id: companyId },
            include: { operators: { where: { role: "OWNER" }, include: { user: true } } },
          });
          const owner = companyInfo?.operators[0]?.user;
          for (const admin of admins) {
            await novu.trigger({
              workflowId: "admin-operator-signup-pending",
              to: {
                subscriberId: admin.email,
                email: admin.email,
              },
              payload: {
                adminEmail: admin.email,
                companyId: companyId,
                companyName: companyInfo?.name ?? "Transport Operator",
                ownerName: owner?.fullName ?? "Operator Owner",
                ownerPhone: owner?.phoneNumber ?? "N/A",
                submittedAt: new Date().toLocaleString("en-US", { timeZone: "UTC" }),
              },
              transactionId: `admin-operator-signup-pending-${companyId}-${admin.id}`,
            }).catch(() => {});
          }
        } catch (err) {
          console.error("Failed to trigger admin-operator-signup-pending:", err);
        }
      }
    }

    return { success: true };
  }),

  resubmitVerification: operatorCompanyProcedure.mutation(async ({ ctx }) => {
    const operator = await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
      include: { company: true },
    });

    if (!operator?.company) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Operator profile not found.",
      });
    }

    if (operator.company.status !== "REJECTED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only rejected companies can resubmit for verification.",
      });
    }

    const updatedCompany = await ctx.prisma.company.update({
      where: { id: operator.companyId },
      data: {
        status: "PENDING_VERIFICATION",
        rejectionReason: null,
      },
    });

    // Trigger admin-operator-signup-pending to admins
    const admins = await ctx.prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, id: true },
    });
    if (admins.length > 0) {
      const novu = getNovuClient();
      if (novu) {
        try {
          const companyInfo = await ctx.prisma.company.findUnique({
            where: { id: operator.companyId },
            include: { operators: { where: { role: "OWNER" }, include: { user: true } } },
          });
          const owner = companyInfo?.operators[0]?.user;
          for (const admin of admins) {
            await novu.trigger({
              workflowId: "admin-operator-signup-pending",
              to: {
                subscriberId: admin.email,
                email: admin.email,
              },
              payload: {
                adminEmail: admin.email,
                companyId: operator.companyId,
                companyName: companyInfo?.name ?? "Transport Operator",
                ownerName: owner?.fullName ?? "Operator Owner",
                ownerPhone: owner?.phoneNumber ?? "N/A",
                submittedAt: new Date().toLocaleString("en-US", { timeZone: "UTC" }),
              },
              transactionId: `admin-operator-signup-pending-resubmit-${operator.companyId}-${admin.id}`,
            }).catch(() => {});
          }
        } catch (err) {
          console.error("Failed to trigger admin-operator-signup-pending:", err);
        }
      }
    }

    return { company: updatedCompany };
  }),

  validateSlug: operatorCompanyProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.company.findUnique({
        where: { slug: input.slug },
      });
      return { isAvailable: !existing };
    }),

  saveOnboardingStep: operatorCompanyProcedure
    .input(saveOnboardingStepSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        step,
        companyData,
        documentsData,
        bankData,
        profileData,
        termsData,
        timeSpentSeconds,
      } = input;

      const STEP_ORDER = [
        "COMPANY",
        "DOCUMENTS",
        "BANK",
        "PROFILE",
        "TERMS",
      ] as const;
      const TOTAL_STEPS = STEP_ORDER.length;

      const computeNextStep = (completed: string[]) =>
        STEP_ORDER.find((s) => !completed.includes(s)) ?? null;

      const buildProgress = (completed: string[]) => {
        const count = completed.length;
        const nextStep = computeNextStep(completed);
        const current = nextStep ?? "TERMS";
        const currentIdx = STEP_ORDER.indexOf(
          current as (typeof STEP_ORDER)[number],
        );
        const nextFinal =
          currentIdx < STEP_ORDER.length - 1
            ? STEP_ORDER[currentIdx + 1]
            : null;
        return {
          currentStep: current,
          nextStep: nextFinal,
          completedSteps: completed,
          completedStepCount: count,
          totalSteps: TOTAL_STEPS,
          percentage: Math.round((count / TOTAL_STEPS) * 100),
        };
      };

      const existingOperator = await ctx.prisma.operator.findFirst({
        where: { userId: ctx.user.id, deletedAt: null },
        orderBy: { joinedAt: "desc" },
        include: { company: true, onboardingProgress: true },
      });

      if (!existingOperator) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Complete signup first to create an operator profile.",
        });
      }

      let resultOperator: any = null;
      const companyId = existingOperator.companyId;
      const operatorId = existingOperator.id;

      const getCompleted = () =>
        (existingOperator.onboardingProgress
          ?.completedSteps as string[] | null) ?? [];

      if (step === "COMPANY") {
        if (!companyData)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Company data required",
          });

        await ctx.prisma.$transaction(async (tx) => {
          try {
            await tx.company.update({
              where: { id: existingOperator.companyId },
              data: {
                name: companyData.name,
                slug: companyData.slug,
                email: companyData.email,
                phone: companyData.phone,
                website: companyData.website ?? null,
                description: companyData.description ?? null,
                businessType: companyData.businessType,
                registrationNumber: companyData.registrationNumber,
                taxId: companyData.taxId,
                yearEstablished: companyData.yearEstablished ?? null,
                estimatedStaffSize: companyData.estimatedStaffSize,
                logoUrl: companyData.logoUrl ?? null,
              },
            });
          } catch (err) {
            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === "P2002"
            ) {
              const field =
                (err.meta?.["target"] as string[] | undefined)?.[0] ?? "field";
              throw new TRPCError({
                code: "CONFLICT",
                message: `A company with this ${field} already exists. Please use a different value.`,
              });
            }
            throw err;
          }

          const existingCompleted = getCompleted();
          const newCompleted = existingCompleted.includes("COMPANY")
            ? existingCompleted
            : [...existingCompleted, "COMPANY"];
          const nextStep = computeNextStep(newCompleted) ?? "TERMS";

          await tx.operatorOnboarding.upsert({
            where: { operatorId: existingOperator.id },
            create: {
              operatorId: existingOperator.id,
              currentStep: nextStep as any,
              completedSteps: newCompleted,
              completedStepCount: newCompleted.length,
            },
            update: {
              currentStep: nextStep as any,
              completedSteps: newCompleted,
              completedStepCount: newCompleted.length,
            },
          });
          await tx.operator.update({
            where: { id: existingOperator.id },
            data: { onboardingStatus: "IN_PROGRESS" },
          });
          
          await tx.user.update({
            where: { id: ctx.user.id },
            data: { workEmail: companyData.email },
          });
        });

        resultOperator = await ctx.prisma.operator.findUnique({
          where: { id: existingOperator.id },
          include: { company: true, onboardingProgress: true },
        });
      } else if (step === "DOCUMENTS") {
          if (!documentsData) throw new TRPCError({ code: "BAD_REQUEST" });
          const now = new Date();
          for (const doc of documentsData.documents) {
            const existing = await ctx.prisma.companyDocument.findFirst({
              where: { companyId, type: doc.type as any, isCurrent: true },
            });
            const newDoc = await ctx.prisma.companyDocument.create({
              data: {
                companyId,
                type: doc.type as any,
                fileName: doc.fileName,
                fileUrl: doc.fileUrl,
                objectKey: doc.objectKey,
                fileSize: doc.fileSize,
                mimeType: doc.mimeType,
                status: "PENDING",
                isCurrent: true,
              },
            });
            if (existing) {
              await ctx.prisma.companyDocument.update({
                where: { id: existing.id },
                data: {
                  isCurrent: false,
                  supersededAt: now,
                  replacedById: newDoc.id,
                },
              });
            }
          }
          const prev = getCompleted();
          const newCompleted = prev.includes("DOCUMENTS")
            ? prev
            : [...prev, "DOCUMENTS"];
          const nextStep = computeNextStep(newCompleted) ?? "TERMS";
          await ctx.prisma.operatorOnboarding.upsert({
            where: { operatorId },
            create: {
              operatorId,
              currentStep: nextStep as any,
              completedSteps: newCompleted,
              completedStepCount: newCompleted.length,
            },
            update: {
              currentStep: nextStep as any,
              completedSteps: newCompleted,
              completedStepCount: newCompleted.length,
            },
          });
          resultOperator = await ctx.prisma.operator.findUnique({
            where: { id: operatorId },
            include: { company: true, onboardingProgress: true },
          });
        } else if (step === "BANK") {
          if (!bankData) throw new TRPCError({ code: "BAD_REQUEST" });

          // The operator-provided account name is used as-is. The authoritative
          // Paystack validation happens when an admin approves the operator and
          // creates the Paystack transfer recipient (admin.ts).
          let resolvedAccountName = bankData.accountName;
          let verifiedByPaystack = false;

          const encryptedAccount = prepareBankAccountStorage(
            bankData.accountNumber,
          );
          
          const bankCreate = {
            companyId,
            isActive: true as const,
            bankName: bankData.bankName,
            bankCode: bankData.bankCode ?? null,
            accountNumber: encryptedAccount.accountNumber,
            accountNumberLast4: encryptedAccount.accountNumberLast4,
            accountName: resolvedAccountName,
            verificationProvider: verifiedByPaystack ? "PAYSTACK" : null,
            verifiedByProvider: verifiedByPaystack,
            lastVerificationAt: verifiedByPaystack ? new Date() : null,
            ...(bankData.branch != null ? { branch: bankData.branch } : {}),
            ...(bankData.swiftCode != null
              ? { swiftCode: bankData.swiftCode }
              : {}),
            ...(bankData.iban != null ? { iban: bankData.iban } : {}),
          };
          const bankUpdate = {
            bankName: bankData.bankName,
            bankCode: bankData.bankCode ?? null,
            accountNumber: encryptedAccount.accountNumber,
            accountNumberLast4: encryptedAccount.accountNumberLast4,
            accountName: resolvedAccountName,
            verificationProvider: verifiedByPaystack ? "PAYSTACK" : null,
            verifiedByProvider: verifiedByPaystack,
            lastVerificationAt: verifiedByPaystack ? new Date() : null,
            ...(bankData.branch != null ? { branch: bankData.branch } : {}),
            ...(bankData.swiftCode != null
              ? { swiftCode: bankData.swiftCode }
              : {}),
            ...(bankData.iban != null ? { iban: bankData.iban } : {}),
          };
          const existingBank = await ctx.prisma.bankAccount.findFirst({
            where: { companyId },
          });
          if (existingBank) {
            await ctx.prisma.bankAccount.update({
              where: { id: existingBank.id },
              data: bankUpdate,
            });
          } else {
            await ctx.prisma.bankAccount.create({
              data: { ...bankCreate, isDefault: true },
            });
          }
          await logBankAccess(ctx.prisma, {
            companyId,
            userId: ctx.user.id,
            action: existingBank ? "UPDATE" : "CREATE",
          });
          const prev = getCompleted();
          const newCompleted = prev.includes("BANK")
            ? prev
            : [...prev, "BANK"];
          const nextStep = computeNextStep(newCompleted) ?? "TERMS";
          await ctx.prisma.operatorOnboarding.upsert({
            where: { operatorId },
            create: {
              operatorId,
              currentStep: nextStep as any,
              completedSteps: newCompleted,
              completedStepCount: newCompleted.length,
            },
            update: {
              currentStep: nextStep as any,
              completedSteps: newCompleted,
              completedStepCount: newCompleted.length,
            },
          });
          resultOperator = await ctx.prisma.operator.findUnique({
            where: { id: operatorId },
            include: { company: true, onboardingProgress: true },
          });
        } else if (step === "PROFILE") {
          if (!profileData) throw new TRPCError({ code: "BAD_REQUEST" });
          await ctx.prisma.user.update({
            where: { id: ctx.user.id },
            data: { fullName: profileData.fullName },
          });
          await ctx.prisma.operator.update({
            where: { id: operatorId },
            data: {
              personalPhone: profileData.personalPhone ?? null,
              role: profileData.role,
              dateOfBirth: profileData.dateOfBirth
                ? new Date(profileData.dateOfBirth)
                : null,
              nationalIdNumber: profileData.nationalIdNumber ?? null,
              nationalIdType: profileData.nationalIdType ?? null,
              jobTitle: profileData.jobTitle ?? null,
              profilePhotoUrl: profileData.profilePhotoUrl ?? null,
              emergencyContactName: profileData.emergencyContactName ?? null,
              emergencyContactPhone: profileData.emergencyContactPhone ?? null,
            },
          });
          const prev = getCompleted();
          const newCompleted = prev.includes("PROFILE")
            ? prev
            : [...prev, "PROFILE"];
          const nextStep = computeNextStep(newCompleted) ?? "TERMS";
          await ctx.prisma.operatorOnboarding.upsert({
            where: { operatorId },
            create: {
              operatorId,
              currentStep: nextStep as any,
              completedSteps: newCompleted,
              completedStepCount: newCompleted.length,
            },
            update: {
              currentStep: nextStep as any,
              completedSteps: newCompleted,
              completedStepCount: newCompleted.length,
            },
          });
          resultOperator = await ctx.prisma.operator.findUnique({
            where: { id: operatorId },
            include: { company: true, onboardingProgress: true },
          });
        } else if (step === "TERMS") {
          if (!termsData) throw new TRPCError({ code: "BAD_REQUEST" });
          const termsNow = new Date();
          await ctx.prisma.company.update({
            where: { id: companyId },
            data: {
              ...(termsData.acceptTerms && {
                termsAcceptedAt: termsNow,
                termsVersion: TERMS_VERSION,
              }),
              ...(termsData.acceptCommission && {
                commissionAcceptedAt: termsNow,
                commissionVersion: COMMISSION_VERSION,
              }),
              ...(termsData.acceptPrivacy && {
                privacyAcceptedAt: termsNow,
                privacyVersion: PRIVACY_VERSION,
              }),
            },
          });
          const prev = getCompleted();
          const newCompleted = prev.includes("TERMS")
            ? prev
            : [...prev, "TERMS"];
          await ctx.prisma.operatorOnboarding.upsert({
            where: { operatorId },
            create: {
              operatorId,
              currentStep: "TERMS",
              completedSteps: newCompleted,
              completedStepCount: newCompleted.length,
            },
            update: {
              currentStep: "TERMS",
              completedSteps: newCompleted,
              completedStepCount: newCompleted.length,
            },
          });
          resultOperator = await ctx.prisma.operator.findUnique({
            where: { id: operatorId },
            include: { company: true, onboardingProgress: true },
          });
        }

      if (!resultOperator) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Step save failed",
        });
      }

      const prog = (resultOperator as any).onboardingProgress;
      const completedFinal = (prog?.completedSteps as string[] | null) ?? [];

      return {
        onboardingStatus: resultOperator.onboardingStatus,
        progress: buildProgress(completedFinal),
        operator: maskOperatorCompanyBank(resultOperator),
      };
    }),

  /** Lightweight shell data for sidebar/header — no company:view required. */
  getShellContext: operatorCompanyProcedure.query(async ({ ctx }) => {
    const operator = await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
      select: {
        id: true,
        role: true,
        profilePhotoUrl: true,
        company: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!operator) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Operator profile not found.",
      });
    }

    return {
      operator: {
        id: operator.id,
        role: operator.role,
        profilePhotoUrl: operator.profilePhotoUrl,
      },
      company: operator.company,
    };
  }),

  ...operatorSettingsProcedures,

  logOnboardingEvent: operatorCompanyProcedure
    .input(logOnboardingEventSchema)
    .mutation(async ({ ctx, input }) => {
      const operator = await ctx.prisma.operator.findFirst({
        where: { userId: ctx.user.id, deletedAt: null },
        orderBy: { joinedAt: "desc" },
      });
      if (!operator) return { success: false };

      await ctx.prisma.operatorOnboardingEvent.create({
        data: {
          operatorId: operator.id,
          step: input.step as any,
          eventType: input.eventType as any,
          timeSpentSeconds: input.timeSpentSeconds ?? null,
          metadata: input.metadata ? (input.metadata as any) : undefined,
          ip: ctx.headers.get("x-forwarded-for") ?? null,
        },
      });
      return { success: true };
    }),

  listBookings: operatorCompanyProcedure
    .input(operatorListBookingsSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "bookings:read");
      const service = new OperatorBookingService(ctx.prisma);
      return service.listCompanyBookings(ctx.companyId, input);
    }),

  // L5: global entity search for the operator command palette. Each section is
  // IAM-gated — operators without the relevant read permission get an empty
  // list rather than an error. Searches: bookings (ref/name/phone), trips
  // (route origin/dest/name), staff (name/email/job title).
  globalSearch: operatorCompanyProcedure
    .input(z.object({ q: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const q = input.q.trim();
      if (!q) return { bookings: [], trips: [], staff: [] };

      const companyId = ctx.companyId;
      const insensitive = { contains: q, mode: "insensitive" as const };

      const [bookings, trips, staff] = await Promise.all([
        operatorHasPermission(ctx, "bookings:read")
          ? ctx.prisma.booking.findMany({
              where: {
                companyId,
                OR: [
                  { bookingReference: { contains: q, mode: "insensitive" } },
                  { passengerName: { contains: q, mode: "insensitive" } },
                  { passengerPhone: { contains: q, mode: "insensitive" } },
                ],
              },
              include: {
                trip: {
                  include: {
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
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 8,
            })
          : [],
        operatorHasPermission(ctx, "trips:read")
          ? ctx.prisma.trip.findMany({
              where: {
                companyId,
                schedule: {
                  route: {
                    OR: [
                      { name: insensitive },
                      { originTerminal: { cityRelation: { name: insensitive } } },
                      { destTerminal: { cityRelation: { name: insensitive } } },
                    ],
                  },
                },
              },
              include: {
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
              },
              orderBy: { departureDate: "desc" },
              take: 8,
            })
          : [],
        operatorHasPermission(ctx, "staff:read")
          ? ctx.prisma.operator.findMany({
              where: {
                companyId,
                deletedAt: null,
                OR: [
                  { user: { fullName: insensitive } },
                  { user: { email: insensitive } },
                  { user: { phoneNumber: insensitive } },
                  { jobTitle: insensitive },
                ],
              },
              include: { user: { select: { fullName: true, email: true } } },
              take: 8,
            })
          : [],
      ]);

      return { bookings, trips, staff };
    }),

  exportBookingsCsv: operatorCompanyProcedure
    .input(operatorListBookingsSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "bookings:read");
      const service = new OperatorBookingService(ctx.prisma);
      const { items } = await service.listCompanyBookings(ctx.companyId, {
        ...input,
        limit: Math.min(input.limit ?? 500, 1000),
        offset: 0,
      });
      const header =
        "bookingReference,passengerName,passengerPhone,status,paymentStatus,seatLabel,tripId,departureTime,origin,destination";
      const rows = items.map((b) =>
        [
          b.bookingReference,
          JSON.stringify(b.passengerName),
          b.passengerPhone,
          b.status,
          b.paymentStatus,
          b.seatLabel,
          b.tripId,
          b.departureTime.toISOString(),
          JSON.stringify(b.originCityName),
          JSON.stringify(b.destinationCityName),
        ].join(","),
      );
      return { csv: [header, ...rows].join("\n"), count: items.length };
    }),

  getBooking: operatorCompanyProcedure
    .input(operatorGetBookingSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "bookings:read");
      const service = new OperatorBookingService(ctx.prisma);
      return service.getCompanyBooking(ctx.companyId, input.bookingId);
    }),

  checkInBooking: operatorCompanyProcedure
    .input(operatorCheckInBookingSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "bookings:update");
      const service = new OperatorBookingService(ctx.prisma);
      return service.checkIn(ctx.companyId, input);
    }),

  cancelBooking: operatorCompanyProcedure
    .input(cancelBookingSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "bookings:update");
      const service = new CancellationService(ctx.prisma);
      return service.cancelBooking({
        bookingReference: input.bookingReference,
        userId: ctx.user.id,
        userRole: "OPERATOR",
        userCompanyId: ctx.companyId,
        channel: input.channel,
        ...(input.reason ? { reason: input.reason } : {}),
      });
    }),

  // L7: bulk check-in — marks all CONFIRMED, not-yet-boarded bookings on a
  // trip as boarded in one call. Reuses the per-booking check-in rules
  // (trip must be boarding; idempotent when already checked in).
  bulkCheckInBookings: operatorCompanyProcedure
    .input(z.object({ tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "bookings:update");
      const service = new OperatorBookingService(ctx.prisma);
      const bookings = await ctx.prisma.booking.findMany({
        where: {
          tripId: input.tripId,
          companyId: ctx.companyId,
          status: "CONFIRMED",
          checkedInAt: null,
        },
        select: { id: true },
      });
      let checkedIn = 0;
      let alreadyCheckedIn = 0;
      for (const b of bookings) {
        const r = await service.checkIn(ctx.companyId, {
          bookingId: b.id,
          tripId: input.tripId,
        });
        if (r.alreadyCheckedIn) alreadyCheckedIn += 1;
        else checkedIn += 1;
      }
      return { requested: bookings.length, checkedIn, alreadyCheckedIn };
    }),

  // L7: bulk cancel — cancels the selected CONFIRMED bookings for a trip in
  // one call, running the normal per-booking cancellation (with refunds).
  bulkCancelBookings: operatorCompanyProcedure
    .input(
      z.object({
        tripId: z.string(),
        bookingIds: z.array(z.string()),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "bookings:update");
      const service = new CancellationService(ctx.prisma);
      const bookings = await ctx.prisma.booking.findMany({
        where: {
          id: { in: input.bookingIds },
          tripId: input.tripId,
          companyId: ctx.companyId,
          status: "CONFIRMED",
        },
        select: { bookingReference: true },
      });
      let cancelled = 0;
      let failed = 0;
      for (const b of bookings) {
        try {
          // All bookings are account-linked, so refunds route to WALLET.
          await service.cancelBooking({
            bookingReference: b.bookingReference,
            userId: ctx.user.id,
            userRole: "OPERATOR",
            userCompanyId: ctx.companyId,
            channel: "WALLET",
            reason: input.reason,
          });
          cancelled += 1;
        } catch {
          failed += 1;
        }
      }
      return { requested: bookings.length, cancelled, failed };
    }),

  // L11: list reviews for this operator's company, with author + booking
  // context, plus aggregate stats for the reviews tab header. Gated to staff
  // who can read bookings (reviews are passenger/booking feedback).
  listReviews: operatorCompanyProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "reviews:read");
    const companyId = ctx.companyId;

    const reviews = await ctx.prisma.review.findMany({
      where: { companyId },
      include: {
        author: { select: { fullName: true, email: true } },
        booking: {
          select: {
            bookingReference: true,
            passengerName: true,
            seat: { select: { label: true } },
            trip: {
              select: {
                departureDate: true,
                schedule: {
                  select: {
                    route: {
                      select: {
                        originTerminal: { include: { cityRelation: true } },
                        destTerminal: { include: { cityRelation: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const total = reviews.length;
    const averageRating =
      total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    return { reviews, total, averageRating, distribution };
  }),

  // L11: operator publishes a response to a passenger review. Only the
  // company that owns the review can respond.
  respondToReview: operatorCompanyProcedure
    .input(z.object({ reviewId: z.string(), response: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "reviews:respond");
      const existing = await ctx.prisma.review.findFirst({
        where: { id: input.reviewId, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }
      return ctx.prisma.review.update({
        where: { id: input.reviewId },
        data: { response: input.response, respondedAt: new Date() },
      });
    }),

  getRevenueAnalytics: operatorCompanyProcedure
    .input(operatorRevenueAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "revenue:view");
      const { from, to } = input;
      const companyId = ctx.companyId;

      const accountService = new FinancialAccountService(ctx.prisma);
      const operatorAcct = await accountService.getOperatorReceivableAccount(companyId);

      const fromDate = new Date(from);
      const toDate = new Date(to);

      // H15: aggregate in the database instead of loading every CONFIRMED
      // booking row into memory. One row per hold group, grouped by route,
      // bucketed by the Abidjan calendar day. `pricingSnapshot.operatorNetXOF`
      // is per hold group, so we group by hold group and dedupe naturally.
      const rows = await ctx.prisma.$queryRaw<Array<{
        day: Date;
        originCity: string | null;
        destCity: string | null;
        net: bigint;
        gross: bigint;
        bookingsCount: bigint;
        tripsCount: bigint;
      }>>`
        SELECT
          DATE_TRUNC('day', MIN(b."issuedAt") AT TIME ZONE 'Africa/Abidjan') AS "day",
          oc."name" AS "originCity",
          dc."name" AS "destCity",
          SUM(ps."operatorNetXOF") AS "net",
          SUM(ps."chargeAmountXOF") AS "gross",
          COUNT(DISTINCT b."id") AS "bookingsCount",
          COUNT(DISTINCT t."id") AS "tripsCount"
        FROM "hold_group" hg
        JOIN "pricing_snapshot" ps ON ps."holdGroupId" = hg."id"
        JOIN "booking" b ON b."holdGroupId" = hg."id"
        JOIN "trip" t ON b."tripId" = t."id"
        JOIN "schedule" s ON t."scheduleId" = s."id"
        JOIN "route" r ON s."routeId" = r."id"
        JOIN "company_location" ocl ON r."originTerminalId" = ocl."id"
        JOIN "company_location" dcl ON r."destTerminalId" = dcl."id"
        LEFT JOIN "city" oc ON ocl."cityId" = oc."id"
        LEFT JOIN "city" dc ON dcl."cityId" = dc."id"
        WHERE b."companyId" = ${companyId}
          AND b."status" = 'CONFIRMED'
          AND b."issuedAt" >= ${fromDate}
          AND b."issuedAt" <= ${toDate}
        GROUP BY hg."id", oc."name", dc."name"
      `;

      let grossRevenueXOF = 0;
      let netRevenueXOF = 0;
      let totalConfirmedBookings = 0;

      const timeSeriesMap = new Map<string, { date: string; netXOF: number }>();
      const routeMap = new Map<
        string,
        {
          routeLabel: string;
          totalNetXOF: number;
          bookingsCount: number;
          tripsCount: number;
          refundsCount: number;
        }
      >();

      for (const row of rows) {
        const net = toSafeDisplayNumber(row.net);
        const gross = toSafeDisplayNumber(row.gross);
        const bookings = toSafeDisplayNumber(row.bookingsCount);
        const trips = toSafeDisplayNumber(row.tripsCount);
        const routeLabel = `${row.originCity ?? "Unknown"} → ${row.destCity ?? "Unknown"}`;

        grossRevenueXOF += gross;
        netRevenueXOF += net;
        totalConfirmedBookings += bookings;

        const dateStr = getCalendarDateKey(new Date(row.day));
        const tsEntry =
          timeSeriesMap.get(dateStr) ?? { date: dateStr, netXOF: 0 };
        tsEntry.netXOF += net;
        timeSeriesMap.set(dateStr, tsEntry);

        const routeEntry =
          routeMap.get(routeLabel) ??
          {
            routeLabel,
            totalNetXOF: 0,
            bookingsCount: 0,
            tripsCount: 0,
            refundsCount: 0,
          };
        routeEntry.totalNetXOF += net;
        routeEntry.bookingsCount += bookings;
        routeEntry.tripsCount += trips;
        routeMap.set(routeLabel, routeEntry);
      }

      // Refunds issued to this operator in the window (all refund DEBIT entries).
      const refundAgg = await ctx.prisma.$queryRaw<Array<{
        refundsIssued: bigint;
        refundsCount: bigint;
      }>>`
        SELECT
          COALESCE(SUM(le."amount"), 0) AS "refundsIssued",
          COUNT(DISTINCT ft."id") AS "refundsCount"
        FROM "ledger_entry" le
        JOIN "financial_transaction" ft ON le."transactionId" = ft."id"
        WHERE ft."type" IN ('REFUND', 'WALLET_REFUND')
          AND le."accountId" = ${operatorAcct.id}
          AND le."side" = 'DEBIT'
          AND ft."createdAt" >= ${fromDate}
          AND ft."createdAt" <= ${toDate}
      `;
      const refundsIssuedXOF = toSafeDisplayNumber(
        refundAgg[0]?.refundsIssued ?? 0n,
      );
      const refundsCount = toSafeDisplayNumber(
        refundAgg[0]?.refundsCount ?? 0n,
      );

      const totalTripsRun = await ctx.prisma.trip.count({
        where: {
          companyId,
          departureDate: { gte: fromDate, lte: toDate },
          status: { in: ["BOARDING", "DEPARTED", "ARRIVED"] },
        },
      });

      const timeSeries = Array.from(timeSeriesMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      const topRoutes = Array.from(routeMap.values())
        .map((r) => ({
          ...r,
          avgFareXOF:
            r.bookingsCount > 0 ? Math.round(r.totalNetXOF / r.bookingsCount) : 0,
        }))
        .sort((a, b) => b.totalNetXOF - a.totalNetXOF)
        .slice(0, 5);

      return {
        kpis: {
          grossRevenueXOF,
          netRevenueXOF,
          refundsIssuedXOF,
          refundsCount,
          totalConfirmedBookings,
          totalTripsRun,
        },
        timeSeries,
        topRoutes,
      };
    }),

  getLedgerEntries: operatorCompanyProcedure
    .input(operatorLedgerFilterSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "revenue:view");
      const { from, to, type, page, limit } = input;
      const companyId = ctx.companyId;

      const accountService = new FinancialAccountService(ctx.prisma);
      const operatorAcct = await accountService.getOperatorReceivableAccount(companyId);

      const where: Prisma.LedgerEntryWhereInput = { accountId: operatorAcct.id };

      if (from && to) {
        where.createdAt = { gte: new Date(from), lte: new Date(to) };
      }

      if (type !== "ALL") {
        if (type === "TICKET_SALE") {
          where.transaction = { type: { in: ["BOOKING", "WALLET_BOOKING"] } };
        } else if (type === "WITHDRAWAL") {
          where.transaction = { type: "OPERATOR_PAYOUT" };
        } else if (type === "REFUND") {
          where.transaction = { type: { in: ["REFUND", "WALLET_REFUND"] } };
        } else if (type === "ADJUSTMENT") {
          where.transaction = { type: "MANUAL_ADJUSTMENT" };
        }
      }

      const [entries, total] = await Promise.all([
        ctx.prisma.ledgerEntry.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: { transaction: true },
        }),
        ctx.prisma.ledgerEntry.count({ where }),
      ]);

      return {
        entries: entries.map((e) => ({
          id: e.id,
          entryType: e.side === "CREDIT" ? "CREDIT" : "DEBIT",
          sourceType: e.transaction.type,
          amountXOF: e.amount,
          description: e.description ?? e.transaction.description,
          status: e.transaction.status,
          transactionId: e.transactionId,
          createdAt: e.createdAt.toISOString(),
        })),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  exportLedgerCsv: operatorCompanyProcedure
    .input(operatorLedgerFilterSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "revenue:view");
      const accountService = new FinancialAccountService(ctx.prisma);
      const operatorAcct = await accountService.getOperatorReceivableAccount(
        ctx.companyId,
      );
      const where: Prisma.LedgerEntryWhereInput = {
        accountId: operatorAcct.id,
      };
      if (input.from && input.to) {
        where.createdAt = {
          gte: new Date(input.from),
          lte: new Date(input.to),
        };
      }
      const entries = await ctx.prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 2000,
        include: { transaction: true },
      });
      const header =
        "createdAt,side,amountXOF,transactionType,status,description,transactionId";
      const rows = entries.map((e) =>
        [
          e.createdAt.toISOString(),
          e.side,
          e.amount,
          e.transaction.type,
          e.transaction.status,
          JSON.stringify(e.description ?? e.transaction.description ?? ""),
          e.transactionId,
        ].join(","),
      );
      return { csv: [header, ...rows].join("\n"), count: entries.length };
    }),

  getDashboardMetrics: operatorCompanyProcedure
    .input(z.object({ clientDate: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireAnyPermission(ctx, ["trips:read", "bookings:read", "company:view"]);
      const companyId = ctx.companyId;
      
      const baseDate = input?.clientDate ? new Date(input.clientDate) : new Date();
      const startOfDay = startOfAppCalendarDay(baseDate);
      const endOfDay = addAppCalendarDays(startOfDay, 1);
      endOfDay.setUTCMilliseconds(-1);
      
      const canReadFleet = operatorHasPermission(ctx, "fleet:read");
      const [todayTrips, totalBuses, activeBuses, bookingsCreatedToday, recentBookings] = await Promise.all([
        ctx.prisma.trip.findMany({
          where: {
            companyId,
            departureDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
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
            _count: {
              select: {
                bookings: {
                  where: {
                    status: "CONFIRMED",
                  },
                },
              },
            },
          },
          orderBy: { departureDate: "asc" },
        }),
        // M27: bus counts are fleet inventory — only expose them to roles with
        // `fleet:read`. Return null (not 0) when absent so the UI can hide the
        // card entirely rather than showing a misleading "0 / 0".
        canReadFleet
          ? ctx.prisma.bus.count({
              where: { companyId, deletedAt: null },
            })
          : Promise.resolve(null),
        canReadFleet
          ? ctx.prisma.bus.count({
              where: { companyId, status: "ACTIVE", deletedAt: null },
            })
          : Promise.resolve(null),
        ctx.prisma.booking.findMany({
          where: {
            trip: { companyId },
            status: "CONFIRMED",
            issuedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            holdGroup: {
              include: { pricingSnapshot: true },
            },
          },
        }),
        ctx.prisma.booking.findMany({
          where: {
            trip: { companyId },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            trip: {
              include: {
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
              },
            },
          },
        })
      ]);

      let revenueTodayXOF = 0;
      const processedHoldGroups = new Set<string>();
      for (const booking of bookingsCreatedToday) {
        const hg = booking.holdGroup;
        if (!hg) continue;
        if (!processedHoldGroups.has(hg.id)) {
          processedHoldGroups.add(hg.id);
          const ps = hg.pricingSnapshot;
          if (ps) {
            revenueTodayXOF += ps.operatorNetXOF;
          }
        }
      }

      const totalTripsToday = todayTrips.length;
      let totalSeatsToday = 0;
      let totalBookingsToday = 0;

      const departures = todayTrips.map((t) => {
        totalSeatsToday += t.totalSeats;
        const bookedCount = t._count.bookings;
        totalBookingsToday += bookedCount;
        
        const origin = t.schedule?.route?.originTerminal?.cityRelation?.name ?? "Unknown";
        const dest = t.schedule?.route?.destTerminal?.cityRelation?.name ?? "Unknown";

        return {
          id: t.id,
          routeLabel: `${origin} → ${dest}`,
          departureTime: t.departureDate.toISOString(),
          status: t.status,
          busLabel: t.bus ? `${t.bus.registrationPlate}${t.bus.internalName ? ` (${t.bus.internalName})` : ""}` : "No Bus Assigned",
          bookedSeats: bookedCount,
          totalSeats: t.totalSeats,
        };
      });

      const occupancyRateToday = totalSeatsToday > 0 
        ? Math.round((totalBookingsToday / totalSeatsToday) * 100) 
        : 0;

      const activities = recentBookings.map((b) => {
        const origin = b.trip.schedule?.route?.originTerminal?.cityRelation?.name ?? "Unknown";
        const dest = b.trip.schedule?.route?.destTerminal?.cityRelation?.name ?? "Unknown";
        
        let actionLabel = "Booked ticket";
        if (b.status === "CONFIRMED") {
          actionLabel = b.checkedInAt ? "Checked in" : "Purchased ticket";
        } else if (b.status === "CANCELLED") {
          actionLabel = "Cancelled booking";
        } else if (b.status === "PENDING_PAYMENT") {
          actionLabel = "Reserved seat (pending payment)";
        }

        const timestamp = b.checkedInAt && b.checkedInAt > b.createdAt 
          ? b.checkedInAt.toISOString() 
          : b.createdAt.toISOString();

        return {
          id: b.id,
          passengerName: b.passengerName,
          action: actionLabel,
          routeLabel: `${origin} → ${dest}`,
          timestamp,
          status: b.status,
          bookingReference: b.bookingReference,
        };
      });

      return {
        stats: {
          totalTripsToday,
          totalBookingsToday,
          occupancyRateToday,
          revenueTodayXOF,
          activeBuses,
          totalBuses,
        },
        departures,
        activities,
      };
    }),

  /**
   * Returns a time-series of daily balance snapshots for the operator's
   * receivable account, ready for charting without replaying ledger entries.
   */
  getSnapshotTimeSeries: operatorCompanyProcedure
    .input(
      z.object({
        period: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).default("DAILY"),
        limit: z.number().int().min(1).max(365).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "revenue:view");
      const companyId = ctx.companyId;
      const accountService = new FinancialAccountService(ctx.prisma);
      const snapshotService = new SnapshotService(ctx.prisma);

      const operatorAcct = await accountService.getOperatorReceivableAccount(companyId);
      const series = await snapshotService.getTimeSeries(
        operatorAcct.id,
        input.period,
        input.limit,
      );

      return {
        accountId: operatorAcct.id,
        period: input.period,
        currentBalance: toSafeDisplayNumber(operatorAcct.postedBalance),
        series: series.map((s) => ({
          date: s.snapshotDate.toISOString().split("T")[0],
          // series balances are already strings from SnapshotService.getTimeSeries
          postedBalance: s.postedBalance,
          reservedBalance: s.reservedBalance,
          availableBalance: s.availableBalance,
        })),
      };
    }),

  /**
   * Returns the latest snapshot and the live posted balance for a quick
   * "closing balance" card without a full ledger scan.
   */
  getAccountSnapshot: operatorCompanyProcedure
    .input(
      z.object({
        period: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).default("DAILY"),
      }),
    )
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "revenue:view");
      const companyId = ctx.companyId;
      const accountService = new FinancialAccountService(ctx.prisma);
      const snapshotService = new SnapshotService(ctx.prisma);

      const operatorAcct = await accountService.getOperatorReceivableAccount(companyId);
      const latest = await snapshotService.getLatest(operatorAcct.id, input.period);

      return {
        livePostedBalance: operatorAcct.postedBalance.toString(),
        liveAvailableBalance: operatorAcct.availableBalance.toString(),
        liveReservedBalance: operatorAcct.reservedBalance.toString(),
        lastSnapshot: latest
          ? {
              date: latest.snapshotDate.toISOString().split("T")[0],
              postedBalance: latest.postedBalance.toString(),
              availableBalance: latest.availableBalance.toString(),
              reservedBalance: latest.reservedBalance.toString(),
            }
          : null,
      };
    }),

  /**
   * Exposes the platform's withdrawal controls to the operator client so the
   * UI can decide whether to show the 2FA step and how to word the frequency
   * rule. (F-18)
   */
  getWithdrawalControls: operatorCompanyProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.platformSettings.findUnique({
      where: { id: "default" },
    });
    return {
      require2FA: Boolean(settings?.require2FAForWithdrawals),
      frequencyHours: settings?.withdrawalFrequencyHours ?? 0,
      minWithdrawalAmount: settings?.minWithdrawalAmount ?? 0,
    };
  }),

  /**
   * Sends a withdrawal 2FA code to the requesting operator's email. Only usable
   * when the platform requires 2FA for withdrawals. The code is single-use and
   * must be presented to `requestWithdrawal` within its TTL. (F-18)
   */
  requestWithdrawalChallenge: operatorCompanyProcedure
    .input(z.object({}).optional())
    .mutation(async ({ ctx }) => {
      requirePermission(ctx, "withdrawals:create");
      const settings = await ctx.prisma.platformSettings.findUnique({
        where: { id: "default" },
      });
      if (!settings?.require2FAForWithdrawals) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA is not required for withdrawals on this platform.",
        });
      }
      const email = ctx.user.email;
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No email on file for this account; cannot send a 2FA code.",
        });
      }
      await createWithdrawalChallenge({
        prisma: ctx.prisma,
        companyId: ctx.companyId,
        userId: ctx.user.id,
        email,
      });
      return { success: true };
    }),

  /**
   * Initiates a withdrawal from the operator's available balance to their verified bank account.
   */
  requestWithdrawal: operatorCompanyProcedure
    .input(
      z.object({
        amountXOF: z.number().int().positive(),
        // Client-supplied idempotency nonce. Makes the withdrawal exactly-once:
        // a duplicate request carrying the same key is short-circuited instead
        // of initiating a second Paystack payout (double-click, network retry,
        // duplicate tab). Falls back to a server-generated UUID when absent.
        idempotencyKey: z.string().min(8).max(100).optional(),
        // Withdrawal 2FA code (F-18). Required only when the platform setting
        // `require_2fa_for_withdrawals` is enabled; verified before any payout.
        twoFactorCode: z.string().min(4).max(12).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "withdrawals:create");
      const companyId = ctx.companyId;
      const amount = input.amountXOF;
      // Stable per-attempt nonce (client-supplied when available).
      const idempotencyKey = input.idempotencyKey?.trim() || crypto.randomUUID();

      // 1. Fetch settings and check minimum withdrawal limit
      const settings = await ctx.prisma.platformSettings.findUnique({
        where: { id: "default" },
      });
      if (settings && amount < settings.minWithdrawalAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Minimum withdrawal amount is ${settings.minWithdrawalAmount} XOF`,
        });
      }

      // 1b. Enforce withdrawal frequency limit (F-18). Reject if this company's
      // most recent non-failed payout is still inside the configured window.
      if (settings && settings.withdrawalFrequencyHours > 0) {
        const since = new Date(
          Date.now() - settings.withdrawalFrequencyHours * 60 * 60 * 1000,
        );
        const recentPayout = await ctx.prisma.financialTransaction.findFirst({
          where: {
            type: "OPERATOR_PAYOUT",
            metadata: { path: ["companyId"], equals: companyId },
            createdAt: { gte: since },
            status: { in: ["POSTED", "SETTLED", "PENDING"] },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true },
        });
        if (recentPayout) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You may only request a withdrawal once every ${settings.withdrawalFrequencyHours} hours. Please try again later.`,
          });
        }
      }

      // 1c. Enforce withdrawal 2FA (F-18). When the platform requires it, the
      // single-use code must be verified BEFORE any balance lock or payout. The
      // code is atomically consumed on success, so a replayed request fails here
      // and the F-17 idempotency gate below stays intact.
      if (settings?.require2FAForWithdrawals) {
        const code = input.twoFactorCode?.trim();
        if (!code) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A 2FA code is required to withdraw. Request one and try again.",
          });
        }
        const result = await verifyWithdrawalChallenge({
          prisma: ctx.prisma,
          companyId,
          code,
        });
        if (!result.ok) {
          const message =
            result.reason === "too_many_attempts"
              ? "Too many incorrect 2FA attempts. Request a new code and try again."
              : result.reason === "expired"
                ? "Your 2FA code has expired. Request a new code and try again."
                : "Invalid 2FA code. Please check and try again.";
          throw new TRPCError({ code: "BAD_REQUEST", message });
        }
      }

      // 2. Fetch the active bank account with the transfer recipient code
      const bankAccount = await ctx.prisma.bankAccount.findFirst({
        where: {
          companyId,
          isDefault: true,
          isVerified: true,
          isActive: true,
        },
      });

      if (!bankAccount || !bankAccount.paystackTransferRecipientCode) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No verified bank account or transfer recipient found. Please contact support.",
        });
      }

      const accountService = new FinancialAccountService(ctx.prisma);

      // 3. Lock account, enforce idempotency, and check balance using AccountingEngine
      const { txId, duplicate } = await ctx.prisma.$transaction(async (tx) => {
        const operatorAcct = await accountService.getOperatorReceivableAccount(companyId);
        const systemAcct = await accountService.getSystemPaystackClearingAccount();

        // Acquire an exclusive row lock on the operator account FIRST so that
        // concurrent withdrawals for the same company serialize. This is what
        // makes the idempotency check below race-safe.
        const lockedAccounts = await tx.$queryRaw<
          { available_balance: number }[]
        >(
          Prisma.sql`SELECT "availableBalance" as available_balance FROM "financial_account" WHERE id = ${operatorAcct.id} FOR UPDATE`
        );

        // Idempotency: if a withdrawal with this key was already recorded, return
        // it WITHOUT initiating a new Paystack payout. Safe because we hold the
        // operator-account lock — a concurrent double-submit cannot commit its
        // transaction until we release this lock.
        const existing = await tx.financialTransaction.findFirst({
          where: {
            type: "OPERATOR_PAYOUT",
            metadata: { path: ["idempotencyKey"], equals: idempotencyKey },
          },
          select: { id: true },
        });
        if (existing) {
          return { txId: existing.id, duplicate: true };
        }

        if (!lockedAccounts.length || BigInt(lockedAccounts[0]!.available_balance) < BigInt(amount)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient available balance.",
          });
        }

        const engine = new AccountingEngine("OPERATOR_PAYOUT", {
          description: `Withdrawal to bank account ${bankAccount.accountNumberLast4}`,
          metadata: {
            requestedBy: ctx.user.id,
            bankAccountId: bankAccount.id,
            idempotencyKey,
            companyId,
          },
        });

        // Withdrawals decrease Liability (Operator Receivable) via DEBIT
        engine.addDebit({
          accountId: operatorAcct.id,
          amount,
          sequenceNumber: 1,
        });

        // Withdrawals decrease Asset (System Clearing) via CREDIT
        engine.addCredit({
          accountId: systemAcct.id,
          amount,
          sequenceNumber: 2,
        });

        return { txId: await engine.commit(tx as any), duplicate: false };
      });

      // Idempotent duplicate: the payout was already initiated for this key.
      if (duplicate) {
        return {
          success: true,
          transactionId: txId,
          transferCode: null,
          duplicate: true,
        };
      }

      // 4. Initiate Paystack Transfer (outside transaction)
      const company = await ctx.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });
      const companyName = company?.name ?? "Transport Operator";

      try {
        const paystack = new PaystackProvider();
        const transfer = await paystack.initiateTransfer({
          amountXOF: amount,
          recipientCode: bankAccount.paystackTransferRecipientCode,
          reason: `Moja Payout - ${companyId.slice(-6)}`,
          reference: txId, // Tie the Paystack transfer strictly to our ledger Tx ID
        });

        // Store transfer info asynchronously — merge metadata, don't overwrite
        const existingTx = await ctx.prisma.financialTransaction.findUnique({
          where: { id: txId },
          select: { metadata: true },
        });
        const prevMeta =
          existingTx?.metadata &&
          typeof existingTx.metadata === "object" &&
          !Array.isArray(existingTx.metadata)
            ? (existingTx.metadata as Record<string, unknown>)
            : {};

        await ctx.prisma.financialTransaction.update({
          where: { id: txId },
          data: {
            externalPaymentId: transfer.transferCode,
            status: transfer.status === "success" ? "POSTED" : "PENDING",
            metadata: {
              ...prevMeta,
              paystackStatus: transfer.status,
              fee: transfer.fee,
              transferCode: transfer.transferCode,
            },
          },
        });

        // Record the Paystack transfer fee as a separate expense
        if (transfer.fee > 0) {
          await ctx.prisma.$transaction(async (tx) => {
            const processorFeeAcct = await accountService.getPaymentProcessorFeeAccount();
            const systemAcct = await accountService.getSystemPaystackClearingAccount();
            const feeEngine = new AccountingEngine("PAYMENT_PROCESSOR_FEE", {
              description: `Paystack transfer fee for payout ${txId}`,
              externalPaymentId: transfer.transferCode,
            });
            feeEngine.addDebit({
              accountId: processorFeeAcct.id,
              amount: transfer.fee,
              sequenceNumber: 1,
            });
            feeEngine.addCredit({
              accountId: systemAcct.id,
              amount: transfer.fee,
              sequenceNumber: 2,
            });
            await feeEngine.commit(tx as any);
          });
        }

        const novu = getNovuClient();
        if (novu && ctx.user.email) {
          try {
            await novu.trigger({
              workflowId: "operator-withdrawal-requested",
              to: {
                subscriberId: ctx.user.email,
                email: ctx.user.email,
              },
              payload: {
                email: ctx.user.email,
                ownerName: ctx.user.name ?? "Operator Owner",
                companyName,
                amountXOF: amount,
                bankName: bankAccount.bankName,
                accountNumberLast4: bankAccount.accountNumberLast4,
                transactionId: txId,
              },
              transactionId: `operator-withdrawal-requested-${txId}`,
            });
          } catch (err) {
            console.error("Failed to trigger operator-withdrawal-requested via Novu:", err);
          }
        }

        return { success: true, transactionId: txId, transferCode: transfer.transferCode };
      } catch (error: any) {
        console.error("Paystack Transfer Initiation Error:", error);

        const message = String(error?.message ?? "Unknown Paystack error");
        const isDefinitiveRejection =
          typeof error?.message === "string" &&
          !/timeout|network|ECONNRESET|ETIMEDOUT|fetch failed|aborted/i.test(
            message,
          ) &&
          !error?.name?.includes("Timeout") &&
          !error?.name?.includes("Abort");

        const novu = getNovuClient();
        if (novu) {
          try {
            const admins = await ctx.prisma.user.findMany({
              where: { role: "ADMIN" },
              select: { email: true, id: true },
            });
            await Promise.all(
              admins.map(async (admin) => {
                if (admin.email) {
                  await novu.trigger({
                    workflowId: "admin-treasury-network-failure",
                    to: {
                      subscriberId: admin.email,
                      email: admin.email,
                    },
                    payload: {
                      email: admin.email,
                      companyId,
                      amountXOF: amount,
                      transactionId: txId,
                      reason: message,
                    },
                    transactionId: `admin-treasury-network-failure-${txId}-${admin.id}`,
                  });
                }
              }),
            );
          } catch (err) {
            console.error("Failed to trigger admin-treasury-network-failure via Novu:", err);
          }
        }

        const existingTx = await ctx.prisma.financialTransaction.findUnique({
          where: { id: txId },
          select: { metadata: true },
        });
        const prevMeta =
          existingTx?.metadata &&
          typeof existingTx.metadata === "object" &&
          !Array.isArray(existingTx.metadata)
            ? (existingTx.metadata as Record<string, unknown>)
            : {};

        if (isDefinitiveRejection) {
          // Paystack explicitly rejected — reverse the ledger so funds are available again
          await ctx.prisma.$transaction(async (tx) => {
            const operatorAcct =
              await accountService.getOperatorReceivableAccount(companyId);
            const systemAcct =
              await accountService.getSystemPaystackClearingAccount();
            const reverse = new AccountingEngine("OPERATOR_PAYOUT_REVERSAL", {
              description: `Reversal of rejected payout ${txId}`,
              metadata: { originalTxId: txId, reason: message },
              idempotencyKey: `PAYOUT_REVERSE_${txId}`,
            });
            reverse.addDebit({
              accountId: systemAcct.id,
              amount,
              sequenceNumber: 1,
            });
            reverse.addCredit({
              accountId: operatorAcct.id,
              amount,
              sequenceNumber: 2,
            });
            await reverse.commit(tx as any);

            await tx.financialTransaction.update({
              where: { id: txId },
              data: {
                status: "FAILED",
                metadata: {
                  ...prevMeta,
                  error: message,
                  definitiveRejection: true,
                },
              },
            });
          });

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Withdrawal rejected by payment provider: ${message}`,
          });
        }

        // Network / timeout: do NOT reverse — funds stay locked pending reconciliation
        await ctx.prisma.financialTransaction.update({
          where: { id: txId },
          data: {
            status: "PENDING",
            metadata: {
              ...prevMeta,
              error: message,
              networkError: true,
              pendingReconciliation: true,
            },
          },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Transfer initiated but the network connection timed out (${message}). Your funds have been locked while we verify the status with Paystack. Please check back in a few minutes.`,
        });
      }
    }),

  listWithdrawals: operatorCompanyProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(10),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "withdrawals:view");
      const companyId = ctx.companyId;
      const accountService = new FinancialAccountService(ctx.prisma);
      const operatorAcct = await accountService.getOperatorReceivableAccount(companyId);

      const [items, total] = await Promise.all([
        ctx.prisma.financialTransaction.findMany({
          where: {
            type: "OPERATOR_PAYOUT",
            entries: {
              some: {
                accountId: operatorAcct.id,
              },
            },
          },
          include: {
            entries: {
              where: {
                accountId: operatorAcct.id,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.financialTransaction.count({
          where: {
            type: "OPERATOR_PAYOUT",
            entries: {
              some: {
                accountId: operatorAcct.id,
              },
            },
          },
        }),
      ]);

      return { items, total };
    }),
});
