import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Prisma } from "@moja/db";
import {
  saveOnboardingStepSchema,
  companyStepSchema,
  bankStepSchema,
  documentSchema,
  operatorListBookingsSchema,
  operatorGetBookingSchema,
  operatorCheckInBookingSchema,
  operatorRevenueAnalyticsSchema,
  logOnboardingEventSchema,
  initSignupSchema,
  verifySignupOtpSchema,
  completeSignupSchema,
} from "@moja/schemas";
import { TERMS_VERSION, PRIVACY_VERSION, COMMISSION_VERSION } from "@/lib/constants/legal";
import crypto from "crypto";
import { startOfAppCalendarDay, addAppCalendarDays } from "@/lib/timezone";

import {
  createTRPCRouter,
  operatorProcedure,
  operatorCompanyProcedure,
  publicProcedure,
  protectedProcedure,
} from "../init";
import { createPresignedUpload } from "@/lib/s3-storage";
import {
  maskBankAccountForClient,
  prepareBankAccountStorage,
  revealBankAccountNumber,
} from "@/lib/bank-account";
import { logBankAccess } from "@/lib/bank-access";
import { OperatorBookingService } from "@/features/operator/services/operator-booking-service";
import {
  paystackResolveAccount,
} from "@/features/payments/providers/paystack-client";

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

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      // In development, log the OTP. In production, you would use an email service
      console.log(`\n=== 🔐 MOCK EMAIL OTP for ${input.email}: ${otp} ===\n`);

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

  verifySignupOtp: publicProcedure
    .input(verifySignupOtpSchema)
    .mutation(async ({ ctx, input }) => {
      const pending = await ctx.prisma.pendingOperatorSignup.findUnique({
        where: { email: input.email },
      });

      if (!pending) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Signup request not found." });
      }

      if (pending.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "OTP expired." });
      }

      if (pending.attempts >= 5) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many failed attempts." });
      }

      const inputHash = crypto.createHash("sha256").update(input.otp).digest("hex");
      if (inputHash !== pending.otpHash) {
        await ctx.prisma.pendingOperatorSignup.update({
          where: { email: input.email },
          data: { attempts: { increment: 1 } },
        });
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid OTP." });
      }

      // Mark as completed
      await ctx.prisma.pendingOperatorSignup.update({
        where: { email: input.email },
        data: { completedAt: new Date() },
      });

      return { success: true };
    }),

  completeSignup: publicProcedure
    .input(completeSignupSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Find the pending signup
      const pending = await ctx.prisma.pendingOperatorSignup.findUnique({
        where: { email: input.email },
      });

      if (!pending || !pending.completedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email not verified or signup not initiated.",
        });
      }

      // 2. Find user created by Better Auth and mark as verified
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      // 3. Create Company (DRAFT), Operator, and Onboarding Progress
      return ctx.prisma.$transaction(async (tx) => {
        const companyId = crypto.randomUUID();
        const company = await tx.company.create({
          data: {
            id: companyId,
            name: pending.companyName,
            slug: `draft-${companyId}`,
            email: pending.email,
            phone: pending.phone,
            registrationNumber: `DRAFT-${companyId}`,
            taxId: `DRAFT-${companyId}`,
            estimatedStaffSize: 1,
            status: "DRAFT",
          },
        });

        const operator = await tx.operator.create({
          data: {
            userId: user.id,
            companyId: company.id,
            role: "OWNER",
          },
        });

        await tx.operatorOnboarding.create({
          data: {
            operatorId: operator.id,
            currentStep: "COMPANY",
            completedSteps: [],
            completedStepCount: 0,
            totalSteps: 5,
          },
        });

        await tx.pendingOperatorSignup.delete({
          where: { email: input.email },
        });

        return { success: true, companyId: company.id };
      });
    }),

  getOnboardingStatus: operatorProcedure.query(async ({ ctx }) => {
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
      };
    }

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
        ctx.prisma.bus.count({ where: { companyId: operator.companyId } }),
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
    };
  }),

  completeOnboarding: operatorProcedure.mutation(async ({ ctx }) => {
    const operator = await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
      include: { onboardingProgress: true },
    });

    if (!operator) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Operator profile not found. Complete onboarding steps first.",
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

    return { success: true };
  }),

  resubmitVerification: operatorProcedure.mutation(async ({ ctx }) => {
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

    return { company: updatedCompany };
  }),

  validateSlug: operatorProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.company.findUnique({
        where: { slug: input.slug },
      });
      return { isAvailable: !existing };
    }),

  saveOnboardingStep: operatorProcedure
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

        try {
          await ctx.prisma.company.update({
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

        await ctx.prisma.operatorOnboarding.upsert({
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
        await ctx.prisma.operator.update({
          where: { id: existingOperator.id },
          data: { onboardingStatus: "IN_PROGRESS" },
        });
        
        await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: { workEmail: companyData.email },
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

          let resolvedAccountName = bankData.accountName;
          let verifiedByPaystack = false;

          if (bankData.bankCode) {
            try {
              const resolved = await paystackResolveAccount({
                accountNumber: bankData.accountNumber,
                bankCode: bankData.bankCode,
              });
              resolvedAccountName = resolved.accountName;
              verifiedByPaystack = true;
            } catch (err: any) {
              // In test environments or unsupported countries, Paystack resolve fails.
              // We gracefully degrade to using the provided name and mark as unverified.
              console.warn(`Paystack resolve failed: ${err.message}`);
              verifiedByPaystack = false;
            }
          }

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

  getSettings: operatorProcedure.query(async ({ ctx }) => {
    const operator = await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
      include: {
        user: true,
        company: {
          include: {
            bankAccounts: true,
            documents: true,
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

    if (operator.company.bankAccounts && operator.company.bankAccounts.length > 0) {
      await logBankAccess(ctx.prisma, {
        companyId: operator.companyId,
        userId: ctx.user.id,
        action: "VIEW_MASKED",
      });
    }

    return {
      company: {
        ...operator.company,
        bankAccounts: operator.company.bankAccounts
          ? operator.company.bankAccounts.map((b: any) => maskBankAccountForClient(b))
          : [],
      },
      operator,
    };
  }),

  updateCompany: operatorCompanyProcedure
    .input(companyStepSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const parsed = companyStepSchema.partial().safeParse(input);
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: parsed.error,
        });
      }

      const cleanData = Object.fromEntries(
        Object.entries(parsed.data).filter(([_, v]) => v !== undefined),
      );

      if (Object.keys(cleanData).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields to update.",
        });
      }

      const updatedCompany = await ctx.prisma.company.update({
        where: { id: ctx.companyId },
        data: cleanData as any,
      });

      return updatedCompany;
    }),

  updateProfile: operatorProcedure
    .input(z.object({ profilePhotoUrl: z.string().url().optional().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const operator = await ctx.prisma.operator.findFirst({
        where: { userId: ctx.user.id, deletedAt: null },
        orderBy: { joinedAt: "desc" },
      });
      if (!operator)
        throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found" });
      const updatedOperator = await ctx.prisma.operator.update({
        where: { id: operator.id },
        data: {
          ...(input.profilePhotoUrl !== undefined && {
            profilePhotoUrl: input.profilePhotoUrl,
          }),
        },
      });
      return updatedOperator;
    }),

  createPresignedUpload: operatorCompanyProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        contentType: z.string().min(1),
        fileSize: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await createPresignedUpload({
          ...input,
          companyId: ctx.companyId,
        });
      } catch (error) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "File storage is not configured.",
        });
      }
    }),

  updateBank: operatorCompanyProcedure
    .input(bankStepSchema)
    .mutation(async ({ ctx, input }) => {
      const parsed = bankStepSchema.safeParse(input);
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: parsed.error,
        });
      }

      const cleanData = Object.fromEntries(
        Object.entries(parsed.data).filter(([_, v]) => v !== undefined),
      );

      const encryptedAccount = prepareBankAccountStorage(
        cleanData["accountNumber"] as string,
      );
      const bankPayload = {
        ...cleanData,
        accountNumber: encryptedAccount.accountNumber,
        accountNumberLast4: encryptedAccount.accountNumberLast4,
      };

      const existingBank = await ctx.prisma.bankAccount.findFirst({
        where: { companyId: ctx.companyId },
      });

      let updatedBank;
      if (existingBank) {
        updatedBank = await ctx.prisma.bankAccount.update({
          where: { id: existingBank.id },
          data: bankPayload as any,
        });
      } else {
        updatedBank = await ctx.prisma.bankAccount.create({
          data: {
            ...(bankPayload as any),
            companyId: ctx.companyId,
            isActive: true,
            isDefault: true,
          },
        });
      }

      await logBankAccess(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: existingBank ? "UPDATE" : "CREATE",
      });

      return maskBankAccountForClient(updatedBank);
    }),

  revealBankAccount: operatorCompanyProcedure
    .input(z.object({ bankAccountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.operator.role !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the company owner can reveal the full bank account number.",
        });
      }

      const bankAccount = await ctx.prisma.bankAccount.findFirst({
        where: { id: input.bankAccountId, companyId: ctx.companyId },
      });

      if (!bankAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank account not found.",
        });
      }

      await logBankAccess(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "VIEW_FULL",
      });

      return {
        accountNumber: revealBankAccountNumber(bankAccount),
      };
    }),

  listBankAccounts: operatorCompanyProcedure
    .query(async ({ ctx }) => {
      const bankAccounts = await ctx.prisma.bankAccount.findMany({
        where: { companyId: ctx.companyId },
        orderBy: { createdAt: "desc" },
      });
      return bankAccounts.map((b) => maskBankAccountForClient(b));
    }),

  addBankAccount: operatorCompanyProcedure
    .input(
      z.object({
        bankName: z.string().min(1),
        bankCode: z.string().min(1),
        accountNumber: z.string().min(1),
        accountName: z.string().min(1),
        branch: z.string().nullable().optional(),
        swiftCode: z.string().nullable().optional(),
        iban: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Resolve bank account on Paystack in real-time
      let resolvedName = input.accountName || "Operator Account";
      try {
        const resolved = await paystackResolveAccount({
          accountNumber: input.accountNumber,
          bankCode: input.bankCode,
        });
        resolvedName = resolved.accountName;
      } catch (err: any) {
        // Fallback if it's a currency or unsupported country error
        const isUnsupported =
          err.message?.includes("valid currencies") ||
          err.message?.includes("currency") ||
          err.message?.includes("not support") ||
          err.message?.includes("unsupported");
        if (isUnsupported && input.accountName) {
          resolvedName = input.accountName;
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Bank details resolution failed: ${err.message}`,
          });
        }
      }

      const encryptedAccount = prepareBankAccountStorage(input.accountNumber);
      
      const newAccount = await ctx.prisma.bankAccount.create({
        data: {
          companyId: ctx.companyId,
          bankName: input.bankName,
          bankCode: input.bankCode,
          accountNumber: encryptedAccount.accountNumber,
          accountNumberLast4: encryptedAccount.accountNumberLast4,
          accountName: resolvedName,
          branch: input.branch ?? null,
          swiftCode: input.swiftCode ?? null,
          iban: input.iban ?? null,
          isVerified: false,
          isActive: true,
          isDefault: false,
        },
      });

      await logBankAccess(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "CREATE",
      });

      return maskBankAccountForClient(newAccount);
    }),

  setDefaultBankAccount: operatorCompanyProcedure
    .input(z.object({ bankAccountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bankAccount = await ctx.prisma.bankAccount.findFirst({
        where: { id: input.bankAccountId, companyId: ctx.companyId },
      });

      if (!bankAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank account not found",
        });
      }

      if (!bankAccount.isVerified) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Only verified bank accounts can be set as default.",
        });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.bankAccount.updateMany({
          where: { companyId: ctx.companyId },
          data: { isDefault: false },
        }),
        ctx.prisma.bankAccount.update({
          where: { id: input.bankAccountId },
          data: { isDefault: true },
        }),
        ctx.prisma.company.update({
          where: { id: ctx.companyId },
          data: { paystackSubaccountCode: bankAccount.paystackSubaccountCode },
        }),
      ]);

      return { success: true };
    }),

  deleteBankAccount: operatorCompanyProcedure
    .input(z.object({ bankAccountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bankAccount = await ctx.prisma.bankAccount.findFirst({
        where: { id: input.bankAccountId, companyId: ctx.companyId },
      });

      if (!bankAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank account not found",
        });
      }

      if (bankAccount.isDefault) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot delete the default bank account.",
        });
      }

      await ctx.prisma.bankAccount.delete({
        where: { id: input.bankAccountId },
      });

      return { success: true };
    }),

  resolveBankAccount: operatorCompanyProcedure
    .input(
      z.object({
        accountNumber: z.string().min(1),
        bankCode: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const resolved = await paystackResolveAccount({
          accountNumber: input.accountNumber,
          bankCode: input.bankCode,
        });
        return resolved;
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Failed to resolve account number",
        });
      }
    }),

  addDocument: operatorCompanyProcedure
    .input(documentSchema)
    .mutation(async ({ ctx, input }) => {
      const parsed = documentSchema.safeParse(input);
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: parsed.error,
        });
      }

      const { expiresAt, ...restData } = parsed.data;
      const doc = await ctx.prisma.companyDocument.create({
        data: {
          ...restData,
          companyId: ctx.companyId,
          status: "PENDING",
          ...(expiresAt !== undefined && { expiresAt }),
        },
      });

      return doc;
    }),

  deleteDocument: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.companyDocument.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
        },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found.",
        });
      }

      await ctx.prisma.companyDocument.delete({
        where: { id: document.id },
      });

      return { success: true };
    }),

  logOnboardingEvent: operatorProcedure
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
      const service = new OperatorBookingService(ctx.prisma);
      return service.listCompanyBookings(ctx.companyId, input);
    }),

  getBooking: operatorCompanyProcedure
    .input(operatorGetBookingSchema)
    .query(async ({ ctx, input }) => {
      const service = new OperatorBookingService(ctx.prisma);
      return service.getCompanyBooking(ctx.companyId, input.bookingId);
    }),

  checkInBooking: operatorCompanyProcedure
    .input(operatorCheckInBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new OperatorBookingService(ctx.prisma);
      return service.checkIn(ctx.companyId, input);
    }),

  getRevenueAnalytics: operatorCompanyProcedure
    .input(operatorRevenueAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      const { from, to } = input;
      const companyId = ctx.companyId;

      // 1. Fetch confirmed pricing snapshots within the period
      // Need to go through HoldGroup -> Bookings (we'll check HoldGroup status and Booking issuedAt)
      // Wait, HoldGroup has no issuedAt. Booking has issuedAt.
      // But we can just use the created bookings for this company.
      // Wait, let's create an OperatorRevenueService for this or do it inline.
      // Doing it inline first:
      
      const confirmedBookings = await ctx.prisma.booking.findMany({
        where: {
          trip: {
            companyId,
          },
          status: "CONFIRMED",
          issuedAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        },
        include: {
          holdGroup: {
            include: {
              pricingSnapshot: true,
            },
          },
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
      });

      // 2. Fetch ledger balance (all time)
      const ledgerEntriesForBalance = await ctx.prisma.operatorLedgerEntry.findMany({
        where: { companyId },
        select: {
          entryType: true,
          amountXOF: true,
        },
      });

      const ledgerBalanceXOF = ledgerEntriesForBalance.reduce((acc, entry) => {
        return entry.entryType === "CREDIT"
          ? acc + entry.amountXOF
          : acc - entry.amountXOF;
      }, 0);

      // 3. Fetch refunds issued within the period
      // Actually refunds don't have a direct companyId on them, but we can query ledger entries of type REFUND
      // Or we can get from Booking -> payments -> refunds. But simpler to use ledger entries.
      const refundsLedger = await ctx.prisma.operatorLedgerEntry.findMany({
        where: {
          companyId,
          sourceType: "REFUND",
          createdAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        },
      });
      const refundsIssuedXOF = refundsLedger.reduce((acc, entry) => acc + entry.amountXOF, 0);

      // 4. Calculate KPIs from bookings
      let grossRevenueXOF = 0;
      let netRevenueXOF = 0;
      let commissionXOF = 0;

      // Group by date for timeSeries
      const timeSeriesMap = new Map<string, { date: string; grossXOF: number; netXOF: number; bookings: number }>();

      // Group by route for topRoutes
      const routeMap = new Map<string, { routeLabel: string; totalNetXOF: number; bookingsCount: number }>();

      // Since pricingSnapshot is per holdGroup, and multiple bookings can share a holdGroup,
      // we need to avoid double counting pricing snapshots.
      const processedHoldGroups = new Set<string>();

      for (const booking of confirmedBookings) {
        const hg = booking.holdGroup;
        if (!hg) continue;
        if (!booking.issuedAt) continue;

        const dateStr = booking.issuedAt.toISOString().split("T")[0] as string; // YYYY-MM-DD
        if (!timeSeriesMap.has(dateStr)) {
          timeSeriesMap.set(dateStr, { date: dateStr, grossXOF: 0, netXOF: 0, bookings: 0 });
        }
        const tsEntry = timeSeriesMap.get(dateStr)!;

        const route = booking.trip.schedule?.route;
        const origin = route?.originTerminal?.cityRelation?.name ?? "Unknown";
        const dest = route?.destTerminal?.cityRelation?.name ?? "Unknown";
        const routeLabel = `${origin} → ${dest}`;
        if (!routeMap.has(routeLabel)) {
          routeMap.set(routeLabel, { routeLabel, totalNetXOF: 0, bookingsCount: 0 });
        }
        const routeEntry = routeMap.get(routeLabel)!;

        // Count bookings
        tsEntry.bookings += 1;
        routeEntry.bookingsCount += 1;

        if (!processedHoldGroups.has(hg.id)) {
          processedHoldGroups.add(hg.id);
          const ps = hg.pricingSnapshot;
          if (ps) {
            grossRevenueXOF += ps.chargeAmountXOF;
            netRevenueXOF += ps.operatorNetXOF;
            commissionXOF += ps.commissionXOF + ps.convenienceFeeXOF;

            tsEntry.grossXOF += ps.chargeAmountXOF;
            tsEntry.netXOF += ps.operatorNetXOF;

            routeEntry.totalNetXOF += ps.operatorNetXOF;
          }
        }
      }

      const timeSeries = Array.from(timeSeriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      const topRoutes = Array.from(routeMap.values())
        .sort((a, b) => b.totalNetXOF - a.totalNetXOF)
        .slice(0, 5);

      // 5. Recent ledger entries
      const recentLedger = await ctx.prisma.operatorLedgerEntry.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return {
        kpis: {
          grossRevenueXOF,
          netRevenueXOF,
          commissionXOF,
          ledgerBalanceXOF,
          refundsIssuedXOF,
          totalConfirmedBookings: confirmedBookings.length,
          totalTripsRun: 0, // Could calculate this if needed
        },
        timeSeries,
        topRoutes,
        recentLedger: recentLedger.map((e) => ({
          id: e.id,
          entryType: e.entryType,
          sourceType: e.sourceType,
          amountXOF: e.amountXOF,
          description: e.description,
          createdAt: e.createdAt.toISOString(),
        })),
      };
    }),

  getDashboardMetrics: operatorCompanyProcedure
    .input(z.object({ clientDate: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      
      const baseDate = input?.clientDate ? new Date(input.clientDate) : new Date();
      const startOfDay = startOfAppCalendarDay(baseDate);
      const endOfDay = addAppCalendarDays(startOfDay, 1);
      endOfDay.setUTCMilliseconds(-1);
      
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
        ctx.prisma.bus.count({
          where: { companyId },
        }),
        ctx.prisma.bus.count({
          where: { companyId, status: "ACTIVE" },
        }),
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
});
