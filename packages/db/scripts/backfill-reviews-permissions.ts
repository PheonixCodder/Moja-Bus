/**
 * Backfill reviews permissions for existing operator staff.
 *
 * Permissions are resolved from the STORED `Operator.permissions` array at
 * runtime (role templates only seed at invite time). Since `reviews:read` /
 * `reviews:respond` are new keys, existing non-owner staff would lose access
 * to the Reviews tab unless their stored permissions include them.
 *
 * This script is ADDITIVE and idempotent: it only unions the reviews keys a
 * role should have into each operator's existing permissions — it never
 * removes anything.
 */
import "dotenv/config";
import { getPrismaClient } from "../src";

// Reviews permissions each role should hold, mirroring the bookings:read /
// bookings:update split used in ROLE_TEMPLATES.
const REVIEWS_PER_ROLE: Record<string, string[]> = {
  ADMIN: ["reviews:read", "reviews:respond"],
  MANAGER: ["reviews:read", "reviews:respond"],
  OPERATIONS: ["reviews:read", "reviews:respond"],
  FINANCE: ["reviews:read"],
  SUPPORT: ["reviews:read", "reviews:respond"],
};

async function main() {
  const prisma = getPrismaClient();

  const operators = await prisma.operator.findMany({
    where: { role: { in: Object.keys(REVIEWS_PER_ROLE) } },
    select: { id: true, role: true, permissions: true },
  });

  console.log(`Found ${operators.length} operator staff to evaluate.`);

  let updated = 0;
  for (const op of operators) {
    const desired = REVIEWS_PER_ROLE[op.role] ?? [];
    const existing = (op.permissions as string[]) ?? [];
    const toAdd = desired.filter((p) => !existing.includes(p));
    if (toAdd.length === 0) continue;

    await prisma.operator.update({
      where: { id: op.id },
      data: { permissions: [...existing, ...toAdd] },
    });
    updated += 1;
    console.log(`+ ${op.role} ${op.id}: added ${toAdd.join(", ")}`);
  }

  console.log(`Done. Updated ${updated} operator(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
