import "dotenv/config";
import { getPrismaClient } from "../src/index";

const prisma = getPrismaClient();

async function main() {
  // Find existing platform admins (UserRole.ADMIN)
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
  });
  
  console.log(`Found ${admins.length} existing ADMIN users`);
  
  for (const [index, admin] of admins.entries()) {
    const existing = await prisma.adminStaff.findUnique({ where: { userId: admin.id } });
    if (!existing) {
      const role = index === 0 ? "SUPER_ADMIN" : "ADMIN"; // First admin = SUPER_ADMIN
      await prisma.adminStaff.create({
        data: {
          userId: admin.id,
          role: role as any,
          permissions: [], // SUPER_ADMIN gets implicit all
          status: "ACTIVE",
          isActive: true,
          joinedAt: admin.createdAt,
          jobTitle: index === 0 ? "Platform Owner" : "Platform Administrator",
        },
      });
      console.log(`Created AdminStaff for ${admin.email} (${role})`);
    } else {
      console.log(`AdminStaff already exists for ${admin.email}`);
    }
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