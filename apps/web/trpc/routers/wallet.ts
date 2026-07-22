import { TRPCError } from "@trpc/server";
import { topUpWalletSchema } from "@moja/schemas";
import { createTRPCRouter, protectedProcedure } from "../init";
import { FinancialAccountService } from "@moja/db";
import { paystackInitialize, buildPaystackReference, paystackPublicKey } from "@/features/payments/providers/paystack-client";
import { getOptionalEnv } from "@moja/config";

export const walletRouter = createTRPCRouter({
  getWalletBalance: protectedProcedure.query(async ({ ctx }) => {
    const accountService = new FinancialAccountService(ctx.prisma);
    const wallet = await accountService.getUserWallet(ctx.user.id);

    return {
      balance: wallet.availableBalance,
      currency: wallet.currency,
    };
  }),

  topUp: protectedProcedure
    .input(topUpWalletSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.paymentMethod !== "PAYSTACK") {
        throw new TRPCError({
          code: "NOT_IMPLEMENTED",
          message: "Only Paystack is supported for top-ups currently",
        });
      }

      // Provision the wallet first
      const accountService = new FinancialAccountService(ctx.prisma);
      const wallet = await accountService.getUserWallet(ctx.user.id);

      // Create an ExternalPayment of type TOP_UP
      const payment = await ctx.prisma.externalPayment.create({
        data: {
          provider: "PAYSTACK",
          amountXOF: input.amountXOF,
          status: "INITIALIZED",
          metadata: {
            isTopUp: true,
            accountId: wallet.id,
            userId: ctx.user.id,
          },
        },
      });

      const attemptNumber = 1;
      const reference = buildPaystackReference(`topup_${payment.id}`, attemptNumber);
      
      const callbackUrl = getOptionalEnv("NEXT_PUBLIC_APP_URL") != null
        ? `${getOptionalEnv("NEXT_PUBLIC_APP_URL")}/dashboard/passenger/wallet?verify=${reference}`
        : undefined;

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { email: true, phoneNumber: true },
      });

      const email = user?.email || (user?.phoneNumber?.replace(/\s+/g, "") + "@guest.mojaride.ci");

      let initialized;
      try {
        initialized = await paystackInitialize({
          email,
          amountXOF: input.amountXOF,
          reference,
          metadata: {
            paymentId: payment.id,
            isTopUp: true,
          },
          ...(callbackUrl ? { callbackUrl } : {}),
        });
      } catch (error) {
        await ctx.prisma.externalPayment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
        throw error;
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.paymentAttempt.create({
          data: {
            paymentId: payment.id,
            attemptNumber,
            paystackReference: reference,
            status: "PENDING",
            metadata: { accessCode: initialized.accessCode },
          },
        });

        await tx.externalPayment.update({
          where: { id: payment.id },
          data: {
            status: "PENDING",
            paystackReference: reference,
            metadata: {
              isTopUp: true,
              accountId: wallet.id,
              userId: ctx.user.id,
              authorizationUrl: initialized.authorizationUrl,
              accessCode: initialized.accessCode,
            },
          },
        });
      });

      return {
        paymentId: payment.id,
        amountXOF: input.amountXOF,
        paystack: {
          publicKey: paystackPublicKey(),
          reference,
          accessCode: initialized.accessCode,
          authorizationUrl: initialized.authorizationUrl,
          email,
        },
      };
    }),
});
