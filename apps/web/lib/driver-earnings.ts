/**
 * Phase 31 (F-DV-11) — pure driver-earnings window/accrual primitives.
 * No DB or tRPC imports so they unit-test under node:test directly.
 *
 * Timezone discipline: Côte d'Ivoire is UTC+0 year-round and the codebase
 * formats against Africa/Abidjan — so UTC boundaries here ARE local ones in
 * production, while staying deterministic on dev machines anywhere.
 *
 * Week convention (Phase 30 D5 ruling): ISO Monday-start weeks via
 * `date_trunc('week')` semantics — the fr-market norm, replacing the old
 * Sunday-start assumption.
 */

/** Placeholder rate; the PlatformSettings column is the live source of truth. */
export const DEFAULT_DRIVER_PAY_RATE_XOF_PER_MINUTE = 50;

/** Midnight UTC of the day containing `now` (= Abidjan midnight). */
export function utcMidnight(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * Monday 00:00 UTC of the week containing `now` (ISO 8601 start).
 * Mirrors Postgres `date_trunc('week', ts)`.
 */
export function mondayStartUtc(now: Date): Date {
  const midnight = utcMidnight(now);
  const daysSinceMonday = (midnight.getUTCDay() + 6) % 7;
  return new Date(midnight.getTime() - daysSinceMonday * 86_400_000);
}

/**
 * Live minutes accrued by an OPEN shift (endedAt null). Closed shifts use
 * the ledger's totalMinutes instead. Negative elapsed (clock skew) floors
 * at zero rather than paying negative money.
 */
export function openShiftAccrualMinutes(startedAt: Date, now: Date): number {
  const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 60_000);
  return Math.max(0, elapsed);
}

/** Round-half-up money conversion — matches Math.round at the call sites. */
export function earningsFromMinutes(
  minutes: number,
  rateXofPerMinute: number,
): number {
  return Math.round(minutes * rateXofPerMinute);
}

export type AffiliationPayConfig = {
  companyId: string;
  companyName: string;
  employmentType?: string;
  payModel?: "HOURLY" | "PER_TRIP" | "MONTHLY_SALARY";
  payRateXOF?: number | null;
};

/**
 * Phase 7 (Gap #17a) — Computes earnings for an affiliation based on its configured payModel.
 */
export function calculateAffiliationEarnings(
  config: AffiliationPayConfig,
  metrics: {
    minutes: number;
    tripsCompleted: number;
    daysInPeriod?: number;
  },
  fallbackRateXofPerMinute: number = DEFAULT_DRIVER_PAY_RATE_XOF_PER_MINUTE,
): { amountXOF: number; isEstimated: boolean; rateDescription: string } {
  if (config.payModel === "MONTHLY_SALARY" && config.payRateXOF != null) {
    const dailySalary = config.payRateXOF / 30;
    const days = metrics.daysInPeriod ?? 1;
    return {
      amountXOF: Math.round(dailySalary * days),
      isEstimated: false,
      rateDescription: `${config.payRateXOF.toLocaleString()} XOF / mois`,
    };
  }

  if (config.payModel === "PER_TRIP" && config.payRateXOF != null) {
    return {
      amountXOF: metrics.tripsCompleted * config.payRateXOF,
      isEstimated: false,
      rateDescription: `${config.payRateXOF.toLocaleString()} XOF / trajet`,
    };
  }

  if (config.payRateXOF != null) {
    const ratePerMin = config.payRateXOF / 60;
    return {
      amountXOF: Math.round(metrics.minutes * ratePerMin),
      isEstimated: false,
      rateDescription: `${config.payRateXOF.toLocaleString()} XOF / heure`,
    };
  }

  // Fallback to platform rate
  return {
    amountXOF: Math.round(metrics.minutes * fallbackRateXofPerMinute),
    isEstimated: true,
    rateDescription: `${Math.round(fallbackRateXofPerMinute * 60).toLocaleString()} XOF / heure (Est.)`,
  };
}

