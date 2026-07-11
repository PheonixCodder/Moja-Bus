import {
  PrismaClient,
  Prisma,
  LedgerEntrySide,
  TransactionStatus,
  LedgerEntryStatus,
  AccountCategory,
} from "@prisma/client";

interface AddEntryParams {
  accountId: string;
  amount: number;
  sequenceNumber: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
}

export class AccountingEngine {
  private entries: (AddEntryParams & { side: LedgerEntrySide })[] = [];
  private type: string;
  private externalPaymentId?: string;
  private description?: string;
  private currency: string;
  private metadata?: Record<string, unknown>;

  constructor(
    type: string,
    params?: {
      currency?: string;
      externalPaymentId?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    this.type = type;
    this.currency = params?.currency ?? "XOF";
    if (params?.externalPaymentId !== undefined) {
      this.externalPaymentId = params.externalPaymentId;
    }
    if (params?.description !== undefined) {
      this.description = params.description;
    }
    if (params?.metadata !== undefined) {
      this.metadata = params.metadata;
    }
  }

  addDebit(params: AddEntryParams): this {
    this.entries.push({ ...params, side: LedgerEntrySide.DEBIT });
    return this;
  }

  addCredit(params: AddEntryParams): this {
    this.entries.push({ ...params, side: LedgerEntrySide.CREDIT });
    return this;
  }

  validate(): void {
    if (this.entries.length === 0) {
      throw new Error("Transaction must have at least one entry");
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of this.entries) {
      if (entry.amount <= 0) {
        throw new Error(`Amount must be strictly positive, got ${entry.amount}`);
      }
      if (entry.side === LedgerEntrySide.DEBIT) {
        totalDebit += entry.amount;
      } else {
        totalCredit += entry.amount;
      }
    }

    if (totalDebit !== totalCredit) {
      throw new Error(
        `Journal validation failed: Σ Debit (${totalDebit}) != Σ Credit (${totalCredit})`
      );
    }
  }

  async commit(
    prisma: PrismaClient | Prisma.TransactionClient
  ): Promise<string> {
    // 1. Validate invariant before executing
    this.validate();

    const execute = async (tx: Prisma.TransactionClient) => {
      // Create the parent transaction
      const transaction = await tx.financialTransaction.create({
        data: {
          type: this.type,
          status: TransactionStatus.POSTED,
          ...(this.externalPaymentId != null ? { externalPaymentId: this.externalPaymentId } : {}),
          currency: this.currency,
          ...(this.description != null ? { description: this.description } : {}),
          ...(this.metadata != null ? { metadata: this.metadata as Prisma.InputJsonValue } : {}),
        },
      });

      // Determine balance deltas per account
      const accountUpdates = new Map<
        string,
        { delta: number; isAssetOrExpense: boolean }
      >();

      for (const entry of this.entries) {
        // Fetch account category if not yet cached in this run
        if (!accountUpdates.has(entry.accountId)) {
          const account = await tx.financialAccount.findUniqueOrThrow({
            where: { id: entry.accountId },
            select: { accountCategory: true },
          });
          const isAssetOrExpense =
            account.accountCategory === AccountCategory.ASSET ||
            account.accountCategory === AccountCategory.EXPENSE;

          accountUpdates.set(entry.accountId, {
            delta: 0,
            isAssetOrExpense,
          });
        }

        const current = accountUpdates.get(entry.accountId)!;

        // Debit increases Asset/Expense, decreases Liability/Equity/Revenue.
        // Credit decreases Asset/Expense, increases Liability/Equity/Revenue.
        let increment = 0;
        if (entry.side === LedgerEntrySide.DEBIT) {
          increment = current.isAssetOrExpense ? entry.amount : -entry.amount;
        } else {
          increment = current.isAssetOrExpense ? -entry.amount : entry.amount;
        }

        current.delta += increment;
        accountUpdates.set(entry.accountId, current);
      }

      // Lock rows and enforce balance rules to prevent race conditions
      // Sort account IDs to prevent deadlocks when locking multiple rows
      const sortedAccountIds = Array.from(accountUpdates.keys()).sort();

      for (const accountId of sortedAccountIds) {
        // CRITICAL: Use SELECT ... FOR UPDATE to exclusively lock the row
        const lockedAccounts = await tx.$queryRaw<
          {
            id: string;
            posted_balance: number;
            allow_negative_balance: boolean;
          }[]
        >(
          Prisma.sql`SELECT id, "postedBalance" as posted_balance, "allowNegativeBalance" as allow_negative_balance FROM "financial_account" WHERE id = ${accountId} FOR UPDATE`
        );

        if (lockedAccounts.length === 0) {
          throw new Error(`Account ${accountId} not found during locking.`);
        }
        
        const lockedAccount = lockedAccounts[0]!;
        const update = accountUpdates.get(accountId)!;
        const newPostedBalance = lockedAccount.posted_balance + update.delta;

        // Verify sufficient funds if negative balance is disallowed
        if (!lockedAccount.allow_negative_balance && newPostedBalance < 0) {
          throw new Error(`Insufficient funds for account ${accountId}`);
        }

        // Apply atomic update now that we hold the lock and verified invariants
        await tx.financialAccount.update({
          where: { id: accountId },
          data: {
            postedBalance: { increment: update.delta },
            availableBalance: { increment: update.delta }, // posted - reserved
          },
        });
      }

      // Create immutable ledger entries
      const entryPromises = this.entries.map((entry) =>
        tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: entry.accountId,
            side: entry.side,
            amount: entry.amount,
            currency: this.currency,
            status: LedgerEntryStatus.POSTED,
            sequenceNumber: entry.sequenceNumber,
            ...(entry.description != null ? { description: entry.description } : {}),
            ...(entry.referenceType != null ? { referenceType: entry.referenceType } : {}),
            ...(entry.referenceId != null ? { referenceId: entry.referenceId } : {}),
            idempotencyKey:
              entry.idempotencyKey ||
              `${transaction.id}-${entry.sequenceNumber}`,
          },
        })
      );

      await Promise.all(entryPromises);

      return transaction.id;
    };

    const isMainClient = '$connect' in prisma && typeof (prisma as any).$connect === 'function';
    if (isMainClient) {
      return (prisma as PrismaClient).$transaction(execute);
    } else {
      return execute(prisma as Prisma.TransactionClient);
    }
  }
}
