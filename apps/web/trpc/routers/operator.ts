import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  saveOnboardingStepSchema,
  companyStepSchema,
  bankStepSchema,
  documentSchema,
  operatorListBookingsSchema,
  operatorGetBookingSchema,
  operatorCheckInBookingSchema,
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

function maskOperatorCompanyBank<T extends { company?: { bankAccount?: any } | null }>(
  operator: T,
): T {
  if (!operator.company?.bankAccount) {
    return operator;
  }

  return {
    ...operator,
    company: {
      ...operator.company,
      bankAccount: maskBankAccountForClient(operator.company.bankAccount),
    },
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
            bankAccount: true,
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
          const company = await ctx.prisma.company.create({
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
          await ctx.prisma.$transaction([
            ctx.prisma.companyLocation.deleteMany({ where: { companyId } }),
            ctx.prisma.companyLocation.createMany({
              data: locationsData.locations.map((loc: any) => ({
                companyId,
                name: loc.name,
                addressLine1: loc.addressLine1,
                addressLine2: loc.addressLine2 ?? null,
                city: loc.city,
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
              })),
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
          const encryptedAccount = prepareBankAccountStorage(
            bankData.accountNumber,
          );
          const bankCreate = {
            companyId,
            isActive: true as const,
            bankName: bankData.bankName,
            accountNumber: encryptedAccount.accountNumber,
            accountNumberLast4: encryptedAccount.accountNumberLast4,
            accountName: bankData.accountName,
            ...(bankData.branch != null ? { branch: bankData.branch } : {}),
            ...(bankData.swiftCode != null
              ? { swiftCode: bankData.swiftCode }
              : {}),
            ...(bankData.iban != null ? { iban: bankData.iban } : {}),
          };
          const bankUpdate = {
            bankName: bankData.bankName,
            accountNumber: encryptedAccount.accountNumber,
            accountNumberLast4: encryptedAccount.accountNumberLast4,
            accountName: bankData.accountName,
            ...(bankData.branch != null ? { branch: bankData.branch } : {}),
            ...(bankData.swiftCode != null
              ? { swiftCode: bankData.swiftCode }
              : {}),
            ...(bankData.iban != null ? { iban: bankData.iban } : {}),
          };
          const existingBank = await ctx.prisma.bankAccount.findUnique({
            where: { companyId },
          });
          await ctx.prisma.bankAccount.upsert({
            where: { companyId },
            create: bankCreate,
            update: bankUpdate,
          });
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
            bankAccount: true,
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

    if (operator.company.bankAccount) {
      await logBankAccess(ctx.prisma, {
        companyId: operator.companyId,
        userId: ctx.user.id,
        action: "VIEW_MASKED",
      });
    }

    return {
      company: {
        ...operator.company,
        bankAccount: operator.company.bankAccount
          ? maskBankAccountForClient(operator.company.bankAccount)
          : null,
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
        cleanData.accountNumber as string,
      );
      const bankPayload = {
        ...cleanData,
        accountNumber: encryptedAccount.accountNumber,
        accountNumberLast4: encryptedAccount.accountNumberLast4,
      };

      const existingBank = await ctx.prisma.bankAccount.findUnique({
        where: { companyId: ctx.companyId },
      });

      const updatedBank = await ctx.prisma.bankAccount.upsert({
        where: { companyId: ctx.companyId },
        create: {
          ...(bankPayload as any),
          companyId: ctx.companyId,
          isActive: true,
        },
        update: bankPayload as any,
      });

      await logBankAccess(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: existingBank ? "UPDATE" : "CREATE",
      });

      return maskBankAccountForClient(updatedBank);
    }),

  revealBankAccount: operatorCompanyProcedure.mutation(async ({ ctx }) => {
    if (ctx.operator.role !== "OWNER") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the company owner can reveal the full bank account number.",
      });
    }

    const bankAccount = await ctx.prisma.bankAccount.findUnique({
      where: { companyId: ctx.companyId },
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
});
