import type { LedgerEntryType, LedgerSourceType, PrismaClient } from "@moja/db";

export class OperatorLedgerService {
  constructor(private prisma: PrismaClient) {}

  async recordEntry(input: {
    companyId: string;
    holdGroupId?: string;
    paymentId?: string;
    entryType: LedgerEntryType;
    sourceType: LedgerSourceType;
    amountXOF: number;
    description: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.operatorLedgerEntry.create({
      data: {
        companyId: input.companyId,
        holdGroupId: input.holdGroupId ?? null,
        paymentId: input.paymentId ?? null,
        entryType: input.entryType,
        sourceType: input.sourceType,
        amountXOF: input.amountXOF,
        description: input.description,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  async recordPaymentCredit(input: {
    companyId: string;
    holdGroupId: string;
    paymentId: string;
    operatorNetXOF: number;
    metadata?: Record<string, unknown>;
  }) {
    if (input.operatorNetXOF <= 0) return null;

    return this.recordEntry({
      companyId: input.companyId,
      holdGroupId: input.holdGroupId,
      paymentId: input.paymentId,
      entryType: "CREDIT",
      sourceType: "PAYMENT",
      amountXOF: input.operatorNetXOF,
      description: "Operator share from confirmed booking payment",
      metadata: input.metadata,
    });
  }
}
