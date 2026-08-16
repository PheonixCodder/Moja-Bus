import type { Prisma, PrismaClient } from "@moja/db";
import { AccountingEngine, FinancialAccountService } from "@moja/db";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Fund a passenger PROMO_CREDITS liability from platform promo expense.
 * Used for admin grants, claim grants, and referral activation.
 */
export async function postPromoCreditGrantLedger(
  prisma: Db,
  input: {
    userId: string;
    amountXOF: number;
    idempotencyKey: string;
    description: string;
    referenceType?: string;
    referenceId?: string;
  },
): Promise<void> {
  if (input.amountXOF <= 0) return;

  const accountService = new FinancialAccountService(prisma as PrismaClient);
  const expense = await accountService.getPlatformPromoExpenseAccount();
  const credits = await accountService.getUserPromoCreditsAccount(input.userId);

  const engine = new AccountingEngine("PROMO_CREDIT_GRANT", {
    description: input.description,
    idempotencyKey: input.idempotencyKey,
  });
  engine.addDebit({
    accountId: expense.id,
    amount: input.amountXOF,
    sequenceNumber: 1,
    referenceType: input.referenceType ?? "USER",
    referenceId: input.referenceId ?? input.userId,
    description: "Promo credit grant expense",
  });
  engine.addCredit({
    accountId: credits.id,
    amount: input.amountXOF,
    sequenceNumber: 2,
    referenceType: input.referenceType ?? "USER",
    referenceId: input.referenceId ?? input.userId,
    description: "Passenger promo credits liability",
  });
  engine.validate();
  await engine.commit(prisma as any);
}
