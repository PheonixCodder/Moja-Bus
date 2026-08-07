import { PrismaClient } from "@moja/db";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data migration...");

  // 1. Migrate operators with 'company:update' to granular keys
  console.log("Migrating operator permissions...");
  const operators = await prisma.operator.findMany({
    where: {
      permissions: {
        has: "company:update",
      },
    },
    select: { id: true, permissions: true, role: true, userId: true },
  });

  console.log(`Found ${operators.length} operators with 'company:update' permission`);

  for (const op of operators) {
    const newPermissions = op.permissions
      .filter((p) => p !== "company:update")
      .concat(["company:profile:update", "company:banking:update", "company:compliance:update"]);

    await prisma.operator.update({
      where: { id: op.id },
      data: { permissions: newPermissions },
    });
    console.log(`  Migrated operator ${op.id} (role: ${op.role})`);
  }

  // 2. Migrate staff invitations with 'company:update'
  console.log("Migrating staff invitation permissions...");
  const invitations = await prisma.staffInvitation.findMany({
    where: {
      permissions: {
        has: "company:update",
      },
    },
    select: { id: true, permissions: true },
  });

  console.log(`Found ${invitations.length} invitations with 'company:update' permission`);

  for (const inv of invitations) {
    const newPermissions = inv.permissions
      .filter((p) => p !== "company:update")
      .concat(["company:profile:update", "company:banking:update", "company:compliance:update"]);

    await prisma.staffInvitation.update({
      where: { id: inv.id },
      data: { permissions: newPermissions },
    });
    console.log(`  Migrated invitation ${inv.id}`);
  }

  // 3. Reassign FINANCE users who have 'withdrawals:create' to TREASURY
  // (since FINANCE template no longer includes withdrawals:create)
  console.log("Checking FINANCE operators with 'withdrawals:create' permission...");
  const financeOps = await prisma.operator.findMany({
    where: {
      role: "FINANCE",
      permissions: {
        has: "withdrawals:create",
      },
    },
    select: { id: true, permissions: true, userId: true },
  });

  console.log(`Found ${financeOps.length} FINANCE operators with 'withdrawals:create'`);

  for (const op of financeOps) {
    // Option 1: Reassign to TREASURY (they keep all FINANCE permissions plus withdrawals:create)
    // Option 2: Keep as FINANCE but remove withdrawals:create (they lose withdrawal creation)
    // We'll reassign to TREASURY since that's the intended role for withdrawal creation
    
    const newPermissions = op.permissions
      .filter((p) => p !== "withdrawals:create")
      .concat(["withdrawals:create", "revenue:export"]);

    await prisma.operator.update({
      where: { id: op.id },
      data: { 
        role: "TREASURY",
        permissions: newPermissions,
      },
    });
    console.log(`  Reassigned operator ${op.id} from FINANCE to TREASURY`);
  }

  console.log("Data migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });