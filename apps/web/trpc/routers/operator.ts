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
} from "@moja/schemas";

import {
  createTRPCRouter,
  operatorProcedure,
  operatorCompanyProcedure,
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
  getOnboardingStatus: operatorProcedure.query(async ({ ctx }) => {
    const operator = await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
      include: {
        company: {
          include: {
            locations: true,
            documents: true,
            bankAccounts: true,
          },
        },
      },
    });

    if (!operator) {
      return {
        onboardingStatus: "NOT_STARTED",
        onboardingCurrentStep: "company",
        operator: null,
      };
    }

    return {
      onboardingStatus: operator.onboardingStatus,
      onboardingCurrentStep: operator.onboardingCurrentStep,
      operator: maskOperatorCompanyBank(operator),
    };
  }),

  completeOnboarding: operatorProcedure.mutation(async ({ ctx }) => {
    const operator = await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
    });

    if (!operator) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Operator profile not found. Complete onboarding steps first.",
      });
    }

    const companyId = operator.companyId;
    const operatorId = operator.id;

    const updatedOperator = await ctx.prisma.operator.update({
      where: { id: operatorId },
      data: {
        onboardingStatus: "COMPLETED",
        onboardingCompletedAt: new Date(),
      },
      include: { company: true },
    });

    await ctx.prisma.company.update({
      where: { id: companyId },
      data: {
        status: "PENDING_VERIFICATION",
      },
    });

    return {
      onboardingStatus: updatedOperator.onboardingStatus,
      onboardingCurrentStep: updatedOperator.onboardingCurrentStep,
      operator: updatedOperator,
    };
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
        locationsData,
        documentsData,
        bankData,
        profileData,
        termsData,
      } = input;

      const existingOperator = await ctx.prisma.operator.findFirst({
        where: { userId: ctx.user.id, deletedAt: null },
        orderBy: { joinedAt: "desc" },
        include: { company: true },
      });

      let resultOperator: any = null;

      if (step === "company") {
        if (!companyData)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Company data required",
          });

        if (existingOperator) {
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
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
              const field = (err.meta?.["target"] as string[] | undefined)?.[0] ?? "field";
              throw new TRPCError({
                code: "CONFLICT",
                message: `A company with this ${field} already exists. Please use a different value.`,
              });
            }
            throw err;
          }

          resultOperator = await ctx.prisma.operator.update({
            where: { id: existingOperator.id },
            data: {
              onboardingStatus: "IN_PROGRESS",
              onboardingCurrentStep: "locations",
              onboardingLastStepAt: new Date(),
            },
            include: { company: true },
          });
        } else {
          let company;
          try {
            company = await ctx.prisma.company.create({
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
                status: "DRAFT",
              },
            });
          } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
              const field = (err.meta?.["target"] as string[] | undefined)?.[0] ?? "field";
              throw new TRPCError({
                code: "CONFLICT",
                message: `A company with this ${field} already exists. Please use a different value.`,
              });
            }
            throw err;
          }

          resultOperator = await ctx.prisma.operator.create({
            data: {
              userId: ctx.user.id,
              companyId: company.id,
              onboardingStatus: "IN_PROGRESS",
              onboardingCurrentStep: "locations",
              onboardingStartedAt: new Date(),
              onboardingLastStepAt: new Date(),
            },
            include: { company: true },
          });

          await ctx.prisma.user.update({
            where: { id: ctx.user.id },
            data: {
              workEmail: companyData.email,
              workPhone: companyData.phone,
            },
          });
        }
      } else {
        if (!existingOperator)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Complete company profile first",
          });
        const companyId = existingOperator.companyId;
        const operatorId = existingOperator.id;

        if (step === "locations") {
          if (!locationsData) throw new TRPCError({ code: "BAD_REQUEST" });

          const cityIds = locationsData.locations.map((l: any) => l.cityId).filter(Boolean) as string[];
          let cities: any[] = [];
          if (cityIds.length > 0) {
            cities = await ctx.prisma.city.findMany({ where: { id: { in: cityIds } } });
          }

          await ctx.prisma.$transaction([
            ctx.prisma.companyLocation.deleteMany({ where: { companyId } }),
            ctx.prisma.companyLocation.createMany({
              data: locationsData.locations.map((loc: any) => {
                let resolvedCityName = loc.city;
                if (loc.cityId) {
                  const foundCity = cities.find(c => c.id === loc.cityId);
                  if (foundCity) {
                    resolvedCityName = foundCity.name;
                  }
                }
                return {
                  companyId,
                  name: loc.name,
                  addressLine1: loc.addressLine1,
                  addressLine2: loc.addressLine2 ?? null,
                  city: resolvedCityName,
                  cityId: loc.cityId ?? null,
                  state: loc.state ?? null,
                postalCode: loc.postalCode ?? null,
                country: loc.country,
                latitude: loc.latitude ?? null,
                longitude: loc.longitude ?? null,
                phone: loc.phone,
                managerName: loc.managerName ?? null,
                managerPhone: loc.managerPhone ?? null,
                managerEmail: loc.managerEmail ?? null,
                isPrimary: loc.isPrimary,
                isActive: loc.isActive,
                // Prisma requires any type or proper structured JSON for Json fields when creating many,
                // Using any cast to avoid type issues with raw payload
                operatingHours: loc.operatingHours
                  ? ({ hours: loc.operatingHours } as any)
                  : null,
                };
              }),
            }),
          ]);
          resultOperator = await ctx.prisma.operator.update({
            where: { id: operatorId },
            data: {
              onboardingCurrentStep: "documents",
              onboardingLastStepAt: new Date(),
            },
            include: { company: true },
          });
        } else if (step === "documents") {
          if (!documentsData) throw new TRPCError({ code: "BAD_REQUEST" });
          await ctx.prisma.$transaction([
            ctx.prisma.companyDocument.deleteMany({ where: { companyId } }),
            ctx.prisma.companyDocument.createMany({
              data: documentsData.documents.map((doc: any) => ({
                companyId,
                type: doc.type,
                fileName: doc.fileName,
                fileUrl: doc.fileUrl,
                fileSize: doc.fileSize,
                mimeType: doc.mimeType,
                status: "PENDING",
              })),
            }),
          ]);
          resultOperator = await ctx.prisma.operator.update({
            where: { id: operatorId },
            data: {
              onboardingCurrentStep: "bank",
              onboardingLastStepAt: new Date(),
            },
            include: { company: true },
          });
        } else if (step === "bank") {
          if (!bankData) throw new TRPCError({ code: "BAD_REQUEST" });

          // Call Paystack resolve account to verify details if bankCode is provided
          let resolvedAccountName = bankData.accountName;
          if (bankData.bankCode) {
            try {
              const resolved = await paystackResolveAccount({
                accountNumber: bankData.accountNumber,
                bankCode: bankData.bankCode,
              });
              resolvedAccountName = resolved.accountName;
            } catch (err: any) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Bank details verification failed: ${err.message || "Invalid account number or bank code"}`,
              });
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
              data: {
                ...bankCreate,
                isDefault: true,
              },
            });
          }
          await logBankAccess(ctx.prisma, {
            companyId,
            userId: ctx.user.id,
            action: existingBank ? "UPDATE" : "CREATE",
          });
          resultOperator = await ctx.prisma.operator.update({
            where: { id: operatorId },
            data: {
              onboardingCurrentStep: "profile",
              onboardingLastStepAt: new Date(),
            },
            include: { company: true },
          });
        } else if (step === "profile") {
          if (!profileData) throw new TRPCError({ code: "BAD_REQUEST" });
          await ctx.prisma.user.update({
            where: { id: ctx.user.id },
            data: { fullName: profileData.fullName },
          });
          resultOperator = await ctx.prisma.operator.update({
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
              onboardingCurrentStep: "terms",
              onboardingLastStepAt: new Date(),
            },
            include: { company: true },
          });
        } else if (step === "terms") {
          if (!termsData) throw new TRPCError({ code: "BAD_REQUEST" });
          const now = new Date();
          resultOperator = await ctx.prisma.operator.update({
            where: { id: operatorId },
            data: {
              onboardingLastStepAt: now,
            },
            include: { company: true },
          });

          if (termsData.acceptTerms) {
            await ctx.prisma.company.update({
              where: { id: companyId },
              data: { termsAcceptedAt: now },
            });
          }
          if (termsData.acceptCommission) {
            await ctx.prisma.company.update({
              where: { id: companyId },
              data: { commissionAcceptedAt: now },
            });
          }
          if (termsData.acceptPrivacy) {
            await ctx.prisma.company.update({
              where: { id: companyId },
              data: { privacyAcceptedAt: now },
            });
          }
        }
      }

      if (!resultOperator) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Step save failed",
        });
      }

      return {
        onboardingStatus: resultOperator.onboardingStatus,
        onboardingCurrentStep: resultOperator.onboardingCurrentStep,
        operator: maskOperatorCompanyBank(resultOperator),
      };
    }),

  getSettings: operatorProcedure.query(async ({ ctx }) => {
    const operator = await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
      include: {
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
      const updatedOperator = await ctx.prisma.operator.update({
        where: { id: ctx.operator.id },
        data: {
          profilePhotoUrl: input.profilePhotoUrl,
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

      const doc = await ctx.prisma.companyDocument.create({
        data: {
          ...parsed.data,
          companyId: ctx.companyId,
          status: "PENDING",
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
});
