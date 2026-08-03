import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { companyStepSchema, profileStepSchema, bankStepSchema, documentSchema } from "@moja/schemas";
import { operatorCompanyProcedure } from "../../init";
import { requirePermission } from "@/lib/permissions/authorize";
import { deleteStorageObject } from "@/lib/storage";
import { maskBankAccountForClient, prepareBankAccountStorage, revealBankAccountNumber } from "@/lib/bank-account";
import { logBankAccess } from "@/lib/bank-access";
import { paystackRegisterRecipient } from "@/features/payments/providers/paystack-client";

/** Registers the Paystack recipient for an operator bank account. Throws with a
 * friendly message if the account number is rejected. */
async function registerRecipientForBank(input: {
  accountNumber: string;
  bankCode: string;
  bankType?: string | null;
  accountName: string;
}) {
  try {
    const result = await paystackRegisterRecipient({
      accountNumber: input.accountNumber,
      bankCode: input.bankCode,
      bankType: input.bankType ?? null,
      accountName: input.accountName,
    });
    return result;
  } catch (err: any) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        err?.message ??
        "We could not verify this account with the selected bank. Check the details and try again.",
    });
  }
}

export const operatorSettingsProcedures = {
  getSettings: operatorCompanyProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "company:view");
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
      requirePermission(ctx, "company:update");
      const parsed = companyStepSchema.partial().safeParse(input);
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: parsed.error,
        });
      }

      const { data: fields } = parsed;

      const updateData = {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.slug !== undefined && { slug: fields.slug }),
        ...(fields.email !== undefined && { email: fields.email }),
        ...(fields.phone !== undefined && { phone: fields.phone }),
        ...(fields.website !== undefined && { website: fields.website }),
        ...(fields.description !== undefined && { description: fields.description }),
        ...(fields.businessType !== undefined && { businessType: fields.businessType }),
        ...(fields.registrationNumber !== undefined && { registrationNumber: fields.registrationNumber }),
        ...(fields.taxId !== undefined && { taxId: fields.taxId }),
        ...(fields.yearEstablished !== undefined && { yearEstablished: fields.yearEstablished }),
        ...(fields.estimatedStaffSize !== undefined && { estimatedStaffSize: fields.estimatedStaffSize }),
        ...(fields.logoUrl !== undefined && { logoUrl: fields.logoUrl }),
      };

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update." });
      }

      const updatedCompany = await ctx.prisma.company.update({
        where: { id: ctx.companyId },
        data: updateData,
      });

      return updatedCompany;
    }),

  updateProfile: operatorCompanyProcedure
    .input(profileStepSchema.partial())
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "company:update");
      const operator = await ctx.prisma.operator.findFirst({
        where: { userId: ctx.user.id, deletedAt: null },
        orderBy: { joinedAt: "desc" },
      });
      if (!operator)
        throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found" });
        
      const parsed = profileStepSchema.partial().safeParse(input);
      if (!parsed.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Validation failed" });
      }

      const { data: profileFields } = parsed;

      const updatedOperator = await ctx.prisma.operator.update({
        where: { id: operator.id },
        data: {
          ...(profileFields.fullName !== undefined && { fullName: profileFields.fullName }),
          ...(profileFields.personalPhone !== undefined && { personalPhone: profileFields.personalPhone }),
          ...(profileFields.jobTitle !== undefined && { jobTitle: profileFields.jobTitle }),
          ...(profileFields.dateOfBirth !== undefined && { dateOfBirth: profileFields.dateOfBirth }),
          ...(profileFields.nationalIdNumber !== undefined && { nationalIdNumber: profileFields.nationalIdNumber }),
          ...(profileFields.nationalIdType !== undefined && { nationalIdType: profileFields.nationalIdType }),
          ...(profileFields.profilePhotoUrl !== undefined && { profilePhotoUrl: profileFields.profilePhotoUrl }),
          ...(profileFields.emergencyContactName !== undefined && { emergencyContactName: profileFields.emergencyContactName }),
          ...(profileFields.emergencyContactPhone !== undefined && { emergencyContactPhone: profileFields.emergencyContactPhone }),
        },
      });
      return updatedOperator;
    }),

  updateBankAccount: operatorCompanyProcedure
    .input(bankStepSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "company:update");

      const { id, ...cleanData } = input;

      if (!cleanData.bankCode) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please select a bank.",
        });
      }

      // Bank account numbers changed, so re-register the Paystack recipient to
      // validate the new number and refresh the payout target immediately.
      const registered = await registerRecipientForBank({
        accountNumber: cleanData.accountNumber,
        bankCode: cleanData.bankCode,
        bankType: cleanData.bankType ?? null,
        accountName: cleanData.accountName,
      });

      const encryptedAccount = prepareBankAccountStorage(
        cleanData.accountNumber,
      );
      const bankPayload = {
        ...cleanData,
        accountNumber: encryptedAccount.accountNumber,
        accountNumberLast4: encryptedAccount.accountNumberLast4,
        isVerified: true,
        verificationProvider: "PAYSTACK" as const,
        verifiedByProvider: true,
        verificationPayload: {
          type: cleanData.bankType ?? "bceao",
          currency: "XOF",
          resolvedAccountName: registered.resolvedAccountName,
          accountNameMatched: registered.accountNameMatched,
        },
        lastVerificationAt: new Date(),
        verifiedAt: new Date(),
        paystackTransferRecipientCode: registered.recipientCode,
      };

      const existingBank = await ctx.prisma.bankAccount.findFirst({
        where: { id, companyId: ctx.companyId },
      });

      if (!existingBank) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bank account not found" });
      }

      const updatedBank = await ctx.prisma.bankAccount.update({
        where: { id },
        data: {
          bankName: bankPayload.bankName,
          accountNumber: bankPayload.accountNumber,
          accountNumberLast4: bankPayload.accountNumberLast4,
          accountName: bankPayload.accountName,
          isVerified: bankPayload.isVerified,
          verificationProvider: bankPayload.verificationProvider,
          verifiedByProvider: bankPayload.verifiedByProvider,
          verificationPayload: bankPayload.verificationPayload,
          lastVerificationAt: bankPayload.lastVerificationAt,
          verifiedAt: bankPayload.verifiedAt,
          paystackTransferRecipientCode: bankPayload.paystackTransferRecipientCode,
          ...(bankPayload.bankCode !== undefined && { bankCode: bankPayload.bankCode }),
          ...(bankPayload.branch !== undefined && { branch: bankPayload.branch }),
          ...(bankPayload.swiftCode !== undefined && { swiftCode: bankPayload.swiftCode }),
          ...(bankPayload.iban !== undefined && { iban: bankPayload.iban }),
        },
      });

      // Keep the company-level recipient in sync when this is the default bank.
      if (updatedBank.isDefault) {
        await ctx.prisma.company.update({
          where: { id: ctx.companyId },
          data: { paystackTransferRecipientCode: registered.recipientCode },
        });
      }

      return maskBankAccountForClient(updatedBank);
    }),

  updateBank: operatorCompanyProcedure
    .input(bankStepSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "company:update");
      const parsed = bankStepSchema.safeParse(input);
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: parsed.error,
        });
      }

      if (!parsed.data.bankCode) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please select a bank.",
        });
      }

      const registered = await registerRecipientForBank({
        accountNumber: parsed.data.accountNumber,
        bankCode: parsed.data.bankCode,
        bankType: parsed.data.bankType ?? null,
        accountName: parsed.data.accountName,
      });

      const encryptedAccount = prepareBankAccountStorage(parsed.data.accountNumber);
      const bankPayload = {
        bankName: parsed.data.bankName,
        accountName: parsed.data.accountName,
        accountNumber: encryptedAccount.accountNumber,
        accountNumberLast4: encryptedAccount.accountNumberLast4,
        bankCode: parsed.data.bankCode,
        branch: parsed.data.branch,
        swiftCode: parsed.data.swiftCode,
        iban: parsed.data.iban,
      };

      const existingBank = await ctx.prisma.bankAccount.findFirst({
        where: { companyId: ctx.companyId },
      });

      const verificationPayload = {
        type: parsed.data.bankType ?? "bceao",
        currency: "XOF",
        resolvedAccountName: registered.resolvedAccountName,
        accountNameMatched: registered.accountNameMatched,
      };

      let updatedBank;
      if (existingBank) {
        updatedBank = await ctx.prisma.bankAccount.update({
          where: { id: existingBank.id },
          data: {
            bankName: bankPayload.bankName,
            accountNumber: bankPayload.accountNumber,
            accountNumberLast4: bankPayload.accountNumberLast4,
            accountName: bankPayload.accountName,
            isVerified: true,
            verificationProvider: "PAYSTACK",
            verifiedByProvider: true,
            verificationPayload,
            lastVerificationAt: new Date(),
            verifiedAt: new Date(),
            paystackTransferRecipientCode: registered.recipientCode,
            ...(bankPayload.bankCode !== undefined && { bankCode: bankPayload.bankCode }),
            ...(bankPayload.branch !== undefined && { branch: bankPayload.branch }),
            ...(bankPayload.swiftCode !== undefined && { swiftCode: bankPayload.swiftCode }),
            ...(bankPayload.iban !== undefined && { iban: bankPayload.iban }),
          },
        });
      } else {
        updatedBank = await ctx.prisma.bankAccount.create({
          data: {
            companyId: ctx.companyId,
            bankName: bankPayload.bankName,
            accountNumber: bankPayload.accountNumber,
            accountNumberLast4: bankPayload.accountNumberLast4,
            accountName: bankPayload.accountName,
            isActive: true,
            isDefault: true,
            isVerified: true,
            verificationProvider: "PAYSTACK",
            verifiedByProvider: true,
            verificationPayload,
            lastVerificationAt: new Date(),
            verifiedAt: new Date(),
            paystackTransferRecipientCode: registered.recipientCode,
            ...(bankPayload.bankCode !== undefined && { bankCode: bankPayload.bankCode }),
            ...(bankPayload.branch !== undefined && { branch: bankPayload.branch }),
            ...(bankPayload.swiftCode !== undefined && { swiftCode: bankPayload.swiftCode }),
            ...(bankPayload.iban !== undefined && { iban: bankPayload.iban }),
          },
        });
      }

      await logBankAccess(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: existingBank ? "UPDATE" : "CREATE",
      });

      if (updatedBank.isDefault) {
        await ctx.prisma.company.update({
          where: { id: ctx.companyId },
          data: { paystackTransferRecipientCode: registered.recipientCode },
        });
      }

      return maskBankAccountForClient(updatedBank);
    }),

  revealBankAccount: operatorCompanyProcedure
    .input(z.object({ bankAccountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "company:view");
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
      requirePermission(ctx, "company:view");
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
        bankType: z.string().nullable().optional(),
        accountNumber: z.string().min(1),
        accountName: z.string().min(1),
        branch: z.string().nullable().optional(),
        swiftCode: z.string().nullable().optional(),
        iban: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "company:update");
      // Use the operator-provided name. Paystack validates the account number
      // when the recipient is registered — wrong details fail here immediately.
      const resolvedName = input.accountName || "Operator Account";

      // Register the Paystack transfer recipient right away so payouts can be
      // processed without an admin round-trip.
      const registered = await registerRecipientForBank({
        accountNumber: input.accountNumber,
        bankCode: input.bankCode,
        bankType: input.bankType ?? null,
        accountName: resolvedName,
      });

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
          isVerified: true,
          verificationProvider: "PAYSTACK",
          verifiedByProvider: true,
          verificationPayload: {
            type: input.bankType ?? "bceao",
            currency: "XOF",
            resolvedAccountName: registered.resolvedAccountName,
            accountNameMatched: registered.accountNameMatched,
          },
          lastVerificationAt: new Date(),
          verifiedAt: new Date(),
          paystackTransferRecipientCode: registered.recipientCode,
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
      requirePermission(ctx, "company:update");
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
          data: { paystackTransferRecipientCode: bankAccount.paystackTransferRecipientCode },
        }),
      ]);

      return { success: true };
    }),

  deleteBankAccount: operatorCompanyProcedure
    .input(z.object({ bankAccountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "company:update");
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

  addDocument: operatorCompanyProcedure
    .input(documentSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "company:update");
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
      requirePermission(ctx, "company:update");
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

      // Remove the underlying S3 object (if it has a stored key).
      if (document.objectKey) {
        await deleteStorageObject({
          purpose: "operator-document",
          objectKey: document.objectKey,
        });
      }

      await ctx.prisma.companyDocument.delete({
        where: { id: document.id },
      });

      return { success: true };
    }),
};
