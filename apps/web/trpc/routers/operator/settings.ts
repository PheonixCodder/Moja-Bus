import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { companyStepSchema, profileStepSchema, bankStepSchema, documentSchema } from "@moja/schemas";
import { operatorCompanyProcedure } from "../../init";
import { requirePermission } from "@/lib/permissions/authorize";
import { deleteStorageObject } from "@/lib/storage";
import { maskBankAccountForClient, prepareBankAccountStorage, revealBankAccountNumber } from "@/lib/bank-account";
import { logBankAccess } from "@/lib/bank-access";
import { getNovuClient } from "@/lib/novu";

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

      const cleanData = Object.fromEntries(
        Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
      );

      const updatedOperator = await ctx.prisma.operator.update({
        where: { id: operator.id },
        data: cleanData as any,
      });
      return updatedOperator;
    }),

  updateBankAccount: operatorCompanyProcedure
    .input(bankStepSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "company:update");
      
      const { id, ...cleanData } = input;

      const encryptedAccount = prepareBankAccountStorage(
        cleanData.accountNumber,
      );
      const bankPayload = {
        ...cleanData,
        accountNumber: encryptedAccount.accountNumber,
        accountNumberLast4: encryptedAccount.accountNumberLast4,
        isVerified: false,
      };

      const existingBank = await ctx.prisma.bankAccount.findFirst({
        where: { id, companyId: ctx.companyId },
      });

      if (!existingBank) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bank account not found" });
      }

      const updatedBank = await ctx.prisma.bankAccount.update({
        where: { id },
        data: bankPayload,
      });

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
          data: {
            ...(bankPayload as any),
            // Changing bank details invalidates Paystack recipient + verification
            isVerified: false,
            paystackTransferRecipientCode: null,
          },
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
        accountNumber: z.string().min(1),
        accountName: z.string().min(1),
        branch: z.string().nullable().optional(),
        swiftCode: z.string().nullable().optional(),
        iban: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "company:update");
      // Use the operator-provided name. Paystack account validation is performed
      // by the admin approval flow when it creates the transfer recipient.
      const resolvedName = input.accountName || "Operator Account";

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

      // Trigger admin-bank-account-pending to all platform admins
      const admins = await ctx.prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true, id: true },
      });
      const company = await ctx.prisma.company.findUnique({
        where: { id: ctx.companyId },
        select: { name: true },
      });
      const novu = getNovuClient();
      if (novu && admins.length > 0 && company) {
        try {
          const hiddenNum = `******${newAccount.accountNumberLast4}`;
          for (const admin of admins) {
            await novu.trigger({
              workflowId: "admin-bank-account-pending",
              to: {
                subscriberId: admin.email,
                email: admin.email,
              },
              payload: {
                adminEmail: admin.email,
                companyName: company.name,
                bankName: newAccount.bankName,
                accountName: newAccount.accountName,
                accountNumberHidden: hiddenNum,
                bankAccountId: newAccount.id,
              },
              transactionId: `admin-bank-account-pending-${newAccount.id}-${admin.id}`,
            }).catch(() => {});
          }
        } catch (err) {
          console.error("Failed to trigger admin-bank-account-pending:", err);
        }
      }

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
