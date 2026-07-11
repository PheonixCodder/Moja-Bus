import "dotenv/config";
import { getPrismaClient, FinancialAccountService } from "../src";

async function main() {
  const prisma = getPrismaClient();
  const accountService = new FinancialAccountService(prisma);

  console.log("Starting ledger reconciliation...");

  const companies = await prisma.company.findMany();
  let mismatches = 0;
  let matches = 0;

  for (const company of companies) {
    // Calculate legacy sum
    const legacyEntries = await prisma.operatorLedgerEntry.findMany({
      where: { companyId: company.id },
    });

    let legacyBalance = 0;
    for (const entry of legacyEntries) {
      if (entry.entryType === "CREDIT") legacyBalance += entry.amountXOF;
      else if (entry.entryType === "DEBIT") legacyBalance -= entry.amountXOF;
    }

    // Get new account balance
    const operatorAcct = await accountService.getOperatorReceivableAccount(company.id);

    if (legacyBalance !== operatorAcct.postedBalance) {
      console.error(
        `MISMATCH for Company ${company.id} (${company.name}): ` +
        `Legacy Balance = ${legacyBalance}, New Balance = ${operatorAcct.postedBalance}`
      );
      mismatches++;
    } else {
      console.log(`MATCH for Company ${company.id} (${company.name}): Balance = ${legacyBalance}`);
      matches++;
    }
  }

  console.log(`\nReconciliation complete. Matches: ${matches}, Mismatches: ${mismatches}`);

  if (mismatches > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
