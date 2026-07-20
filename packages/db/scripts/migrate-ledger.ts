import "dotenv/config";
import { getPrismaClient, AccountingEngine, FinancialAccountService } from "../src";

async function main() {
  const prisma = getPrismaClient();
  const accountService = new FinancialAccountService(prisma);
  const clearingAcct = await accountService.getSystemPaystackClearingAccount();


  console.log("Starting ledger migration...");

  // We process entries in order of creation
  const entries = await prisma.operatorLedgerEntry.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${entries.length} OperatorLedgerEntry records.`);

  let successCount = 0;
  let skippedCount = 0;

  for (const entry of entries) {
    // Check if already migrated
    const existingTx = await prisma.financialTransaction.findFirst({
      where: {
        metadata: {
          path: ["legacyLedgerEntryId"],
          equals: entry.id,
        },
      },
    });

    if (existingTx) {
      skippedCount++;
      continue;
    }

    const operatorAcct = await accountService.getOperatorReceivableAccount(entry.companyId);

    await prisma.$transaction(async (tx) => {
      const type = entry.sourceType === "PAYMENT" ? "BOOKING" :
                   entry.sourceType === "REFUND" ? "REFUND" :
                   "ADJUSTMENT";

      const engine = new AccountingEngine(type, {
        externalPaymentId: entry.paymentId ?? undefined,
        description: `MIGRATED: ${entry.description}`,
        metadata: {
          legacyLedgerEntryId: entry.id,
          legacyMetadata: entry.metadata,
        },
      });

      let seq = 1;

      // In the legacy system, a CREDIT entry to the operator meant they earned money
      // from a payment. We need a corresponding DEBIT somewhere to balance it.
      if (entry.entryType === "CREDIT") {
        engine.addDebit({
          accountId: clearingAcct.id,
          amount: entry.amountXOF,
          sequenceNumber: seq++,
          referenceType: "LEGACY_LEDGER",
          referenceId: entry.id,
          description: "Balancing debit for legacy credit",
        });

        engine.addCredit({
          accountId: operatorAcct.id,
          amount: entry.amountXOF,
          sequenceNumber: seq++,
          referenceType: "LEGACY_LEDGER",
          referenceId: entry.id,
          description: "Operator ticket revenue",
        });
      } else {
        // A DEBIT entry meant they owed money (e.g. a refund)
        engine.addDebit({
          accountId: operatorAcct.id,
          amount: entry.amountXOF,
          sequenceNumber: seq++,
          referenceType: "LEGACY_LEDGER",
          referenceId: entry.id,
          description: "Operator refund deduction",
        });

        engine.addCredit({
          accountId: clearingAcct.id,
          amount: entry.amountXOF,
          sequenceNumber: seq++,
          referenceType: "LEGACY_LEDGER",
          referenceId: entry.id,
          description: "Balancing credit for legacy debit",
        });
      }

      engine.validate();
      await engine.commit(tx as any);
    });

    successCount++;
  }

  console.log(`Migration complete. Processed: ${successCount}, Skipped: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
