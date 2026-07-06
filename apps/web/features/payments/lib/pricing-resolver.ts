import type { CommissionDistanceTier, PlatformSettings } from "@moja/db";

export type PricingBreakdown = {
  distanceKm: number | null;
  commissionBps: number;
  convenienceFeeBps: number;
  baseFareXOF: number;
  seatCount: number;
  subtotalBaseXOF: number;
  convenienceFeeXOF: number;
  chargeAmountXOF: number;
  commissionXOF: number;
  operatorNetXOF: number;
  platformGrossXOF: number;
};

function roundXOF(value: number): number {
  return Math.round(value);
}

export function resolveCommissionBps(
  distanceKm: number | null,
  tiers: CommissionDistanceTier[],
  defaultBps: number,
): number {
  if (distanceKm == null || Number.isNaN(distanceKm)) {
    return defaultBps;
  }

  const activeTiers = tiers
    .filter((tier) => tier.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const tier of activeTiers) {
    const withinMin = distanceKm >= tier.minDistanceKm;
    const withinMax =
      tier.maxDistanceKm == null || distanceKm < tier.maxDistanceKm;
    if (withinMin && withinMax) {
      return tier.commissionBps;
    }
  }

  return defaultBps;
}

export function buildPricingBreakdown(input: {
  baseFareXOF: number;
  seatCount: number;
  distanceKm: number | null;
  commissionBps: number;
  convenienceFeeBps: number;
}): PricingBreakdown {
  const subtotalBaseXOF = input.baseFareXOF * input.seatCount;
  const convenienceFeeXOF = roundXOF(
    (subtotalBaseXOF * input.convenienceFeeBps) / 10_000,
  );
  const commissionXOF = roundXOF(
    (subtotalBaseXOF * input.commissionBps) / 10_000,
  );
  const chargeAmountXOF = subtotalBaseXOF + convenienceFeeXOF;
  const operatorNetXOF = subtotalBaseXOF - commissionXOF;
  const platformGrossXOF = commissionXOF + convenienceFeeXOF;

  return {
    distanceKm: input.distanceKm,
    commissionBps: input.commissionBps,
    convenienceFeeBps: input.convenienceFeeBps,
    baseFareXOF: input.baseFareXOF,
    seatCount: input.seatCount,
    subtotalBaseXOF,
    convenienceFeeXOF,
    chargeAmountXOF,
    commissionXOF,
    operatorNetXOF,
    platformGrossXOF,
  };
}

export async function loadPlatformSettings(
  prisma: {
    platformSettings: {
      findUnique: (args: {
        where: { id: string };
      }) => Promise<PlatformSettings | null>;
      create: (args: {
        data: { id: string };
      }) => Promise<PlatformSettings>;
    };
    commissionDistanceTier: {
      findMany: (args: {
        where: { isActive: boolean };
        orderBy: { sortOrder: "asc" };
      }) => Promise<CommissionDistanceTier[]>;
    };
  },
): Promise<{
  settings: PlatformSettings;
  tiers: CommissionDistanceTier[];
}> {
  let settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    settings = await prisma.platformSettings.create({ data: { id: "default" } });
  }

  const tiers = await prisma.commissionDistanceTier.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return { settings, tiers };
}

export function resolvePricing(input: {
  baseFareXOF: number;
  seatCount: number;
  distanceKm: number | null;
  settings: PlatformSettings;
  tiers: CommissionDistanceTier[];
}): PricingBreakdown {
  const commissionBps = resolveCommissionBps(
    input.distanceKm,
    input.tiers,
    input.settings.defaultCommissionBps,
  );

  return buildPricingBreakdown({
    baseFareXOF: input.baseFareXOF,
    seatCount: input.seatCount,
    distanceKm: input.distanceKm,
    commissionBps,
    convenienceFeeBps: input.settings.defaultConvenienceFeeBps,
  });
}

/** Paystack expects XOF amounts multiplied by 100 (smallest currency unit). */
export function toPaystackAmountXOF(amountXOF: number): number {
  return amountXOF * 100;
}
