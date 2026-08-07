import "dotenv/config";
import { getPrismaClient } from "../src/index";

// Usage:
//   pnpm --filter db tsx scripts/create-admin-staff.ts
//
// Purpose:
//   After manually setting User.role = "ADMIN" on one or more users (via SQL or
//   the admin), the hardened adminProcedure in apps/web/trpc/init.ts still
//   requires those users to have a *live AdminStaff profile* (deletedAt = null,
//   status != SUSPENDED). Setting user.role alone is no longer sufficient.
//
//   This script scans every user whose User.role is ADMIN and creates the
//   missing AdminStaff row so they can access the admin dashboard. It is
//   idempotent: existing live profiles are skipped, the deterministic first
//   ADMIN (email asc, then createdAt asc) is promoted to SUPER_ADMIN, and
//   soft-deleted members for that user are re-activated.
//
//   Note: this script does NOT modify User.role. Set role = ADMIN yourself,
//   then run this to create the required AdminStaff records.

const prisma = getPrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: [{ email: "asc" }, { createdAt: "asc" }],
  });

  console.log(`Found ${admins.length} user(s) with User.role = ADMIN\n`);

  // Deterministic: the first ADMIN (by email, then createdAt) becomes the
  // SUPER_ADMIN if no live SUPER_ADMIN exists anywhere.
  const superAdminUserId = admins[0]?.id;
  const liveSuperAdmin = await prisma.adminStaff.findFirst({
    where: { role: "SUPER_ADMIN", deletedAt: null },
    select: { id: true },
  });
  const hasLiveSuperAdmin = Boolean(liveSuperAdmin);
  if (!hasLiveSuperAdmin) {
    console.log(
      `No live SUPER_ADMIN found. First ADMIN (${superAdminUserId ? "selected" : "(none)"}) will be promoted.`,
    );
  }

  let created = 0;
  let restored = 0;
  let promoted = 0;
  let skipped = 0;

  for (const admin of admins) {
    const existing = await prisma.adminStaff.findUnique({
      where: { userId: admin.id },
    });

    if (!existing) {
      const isSuperAdminTarget = admin.id === superAdminUserId;
      await prisma.adminStaff.create({
        data: {
          userId: admin.id,
          role: isSuperAdminTarget ? "SUPER_ADMIN" : "ADMIN",
          permissions: [], // SUPER_ADMIN gets implicit all-at-runtime; ADMIN uses role-template resolution.
          status: "ACTIVE",
          isActive: true,
          joinedAt: admin.createdAt,
          jobTitle: isSuperAdminTarget ? "Platform Owner" : "Platform Administrator",
        },
      });
      console.log(
        `  [created]   ${admin.email} -> ${isSuperAdminTarget ? "SUPER_ADMIN" : "ADMIN"}`,
      );
      created++;
      continue;
    }

    // Row exists. If it's soft-deleted or inactive, re-activate it.
    if (existing.deletedAt !== null || !existing.isActive) {
      await prisma.adminStaff.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          isActive: true,
          status: "ACTIVE",
        },
      });
      console.log(`  [restored]  ${admin.email} (was ${existing.status}, isActive=${existing.isActive})`);
      restored++;
    } else if (!hasLiveSuperAdmin && existing.role !== "SUPER_ADMIN") {
      // No live SUPER_ADMIN anywhere and this is the deterministic first ADMIN:
      // promote it so SUPER_ADMIN-only flows stay accessible.
      if (admin.id === superAdminUserId) {
        await prisma.adminStaff.update({
          where: { id: existing.id },
          data: {
            role: "SUPER_ADMIN",
            permissions: [],
            status: "ACTIVE",
            isActive: true,
            deletedAt: null,
          },
        });
        console.log(`  [promoted]  ${admin.email} -> SUPER_ADMIN (re-bootstrap)`);
        promoted++;
      } else {
        console.log(`  [skipped]   ${admin.email} (${existing.role}, already live)`);
        skipped++;
      }
    } else {
      console.log(`  [skipped]   ${admin.email} (${existing.role}, already live)`);
      skipped++;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`  created:   ${created}`);
  console.log(`  restored:  ${restored}`);
  console.log(`  promoted:  ${promoted}`);
  console.log(`  skipped:   ${skipped}`);
  console.log(`  total ADMIN users scanned: ${admins.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
