import { getPrismaClient } from "@moja/db";

async function main() {
  const prisma = getPrismaClient();
  const result = await prisma.financialAccount.updateMany({
    where: { accountClass: "OPERATOR_RECEIVABLE" },
    data: { allowNegativeBalance: true },
  });
  console.log(`Patched ${result.count} operator accounts.`);
}

main();
