import type { Prisma, PrismaClient } from "@moja/db";

type Db = PrismaClient | Prisma.TransactionClient;

/** Platform marketing actions on AdminStaffActivityLog (no companyId required). */
export async function logMarketingActivity(
  prisma: Db,
  input: {
    userId: string;
    action: string;
    description: string;
    metadata?: Prisma.InputJsonValue | undefined;
    targetUserId?: string | undefined;
  },
): Promise<void> {
  await prisma.adminStaffActivityLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      description: input.description,
      ...(input.targetUserId !== undefined
        ? { targetUserId: input.targetUserId }
        : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    },
  });
}
