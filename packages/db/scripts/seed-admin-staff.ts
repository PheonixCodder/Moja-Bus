import "dotenv/config";
import { getPrismaClient } from "../src/index";

const prisma = getPrismaClient();

async function main() {
  // Find existing platform admins (UserRole.ADMIN), deterministically ordered:
  // email ascending, then createdAt ascending. Ordering is mandatory here --
  // the first ADMIN becomes the SUPER_ADMIN, and relying on insertion order
  // would make bootstrap nondeterministic across environments.
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: [{ email: "asc" }, { createdAt: "asc" }],
  });

  console.log(`Found ${admins.length} existing ADMIN users`);

  const superAdminUserId = admins[0]?.id;

  const liveSuperAdmin = await prisma.adminStaff.findFirst({
    where: { role: "SUPER_ADMIN", deletedAt: null },
    select: { id: true },
  });
  const hasLiveSuperAdmin = Boolean(liveSuperAdmin);

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
          permissions: [], // SUPER_ADMIN gets implicit all at runtime
          status: "ACTIVE",
          isActive: true,
          joinedAt: admin.createdAt,
          jobTitle: isSuperAdminTarget
            ? "Platform Owner"
            : "Platform Administrator",
        },
      });
      console.log(`Created AdminStaff for ${admin.email} (${admin.id === superAdminUserId ? "SUPER_ADMIN" : "ADMIN"})`);
      continue;
    }

    // Re-bootstrap: if no live SUPER_ADMIN exists anywhere, promote the
    // deterministic first ADMIN. This self-heals a state where every
    // SUPER_ADMIN row was removed, which would otherwise permanently lock
    // SUPER_ADMIN-only flows (ownership transfer, staff management), while
    // leaving all other staff rows untouched.
    if (!hasLiveSuperAdmin && existing.role !== "SUPER_ADMIN") {
      if (admin.id === superAdminUserId) {
        await prisma.adminStaff.update({
          where: { id: existing.id },
          data: {
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            isActive: true,
            deletedAt: null,
          },
        });
        console.log(
          `Promoted AdminStaff for ${admin.email} to SUPER_ADMIN (re-bootstrap)`,
        );
      } else if (existing.deletedAt) {
        // Re-activate a soft-deleted member so the first-in-line ADMIN is alive.
        await prisma.adminStaff.update({
          where: { id: existing.id },
          data: { deletedAt: null, role: "ADMIN", status: "ACTIVE", isActive: true },
        });
      }
      continue;
    }

    console.log(`AdminStaff already exists for ${admin.email}`);
  }

  console.log("Admin staff seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });