import type { PrismaClient } from "@moja/db";

export type BankAccessAction =
  | "VIEW_MASKED"
  | "VIEW_FULL"
  | "CREATE"
  | "UPDATE";

type LogBankAccessInput = {
  companyId: string;
  userId: string;
  action: BankAccessAction;
  ip?: string | null;
};

export async function logBankAccess(
  prisma: PrismaClient,
  input: LogBankAccessInput,
) {
  const delegate = (prisma as PrismaClient & { bankAccessLog?: { create: unknown } })
    .bankAccessLog;

  if (!delegate?.create) {
    console.warn(
      "[bank-access] bankAccessLog model unavailable — run `pnpm --filter @moja/db generate` and restart the dev server",
    );
    return;
  }

  try {
    await prisma.bankAccessLog.create({
      data: {
        companyId: input.companyId,
        userId: input.userId,
        action: input.action,
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[bank-access] Failed to write audit log:", error);
  }
}
