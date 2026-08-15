import type { PrismaClient } from "@moja/db";
import { MAX_PROMOTIONAL_VOUCHERS_PER_USER } from "./promo-ceilings";

export type PromoPolicy = {
  maxPromotionalVouchersPerUser: number;
};

export async function getPromoPolicy(
  prisma: PrismaClient,
): Promise<PromoPolicy> {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });
  const raw =
    settings?.maxPromotionalVouchersPerUser ??
    MAX_PROMOTIONAL_VOUCHERS_PER_USER;
  return {
    maxPromotionalVouchersPerUser: Math.max(1, Math.min(20, raw)),
  };
}
