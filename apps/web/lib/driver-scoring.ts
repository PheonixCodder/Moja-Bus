/**
 * Phase 13 — Driver safety scoring engine.
 *
 * Lifetime metric starting at 100, floor 0, never resets.
 *  - OVERSPEED event:   −5 points
 *  - HARSH_BRAKING:     −10 points
 *  - Daily loss cap:    −20 points per UTC day (catastrophe guard)
 *  - Clean credit:      +1 per 10 consecutive anomaly-free completed trips
 *
 * Intraday updates apply deltas; the nightly reconcile cron recomputes the
 * authoritative score from source data (self-healing drift).
 */

export const SAFETY_SCORE_START = 100;
export const SAFETY_SCORE_FLOOR = 0;
export const SAFETY_SCORE_CEILING = 100;

export const PENALTY_OVERSPEED = 5;
export const PENALTY_HARSH_BRAKING = 10;
export const MAX_DAILY_PENALTY = 20;

export const CLEAN_TRIPS_PER_CREDIT = 10;
export const CLEAN_TRIP_CREDIT = 1;

export const OVERSPEED_LIMIT_KMH = 110;

/**
 * Phase 28/29 (F-TM-14) — horizontal-accuracy threshold for a trustworthy
 * GPS fix. Single source of truth: the validator re-exports it, and this is
 * also where LOW_ACCURACY classification lives. Fixes failing it are
 * persisted for history but NEVER score and never serve as jump-gate or
 * last-position references.
 */
export const MAX_PING_ACCURACY_METERS = 50;

export type AnomalyReason =
  | "OVERSPEED"
  | "HARSH_BRAKING"
  | "DELAY"
  | "LOW_ACCURACY";

/** Penalties applied per persisted anomaly event (DELAY incidents excluded from scoring). */
export function anomalyPenalty(reason: string | null | undefined): number {
  switch (reason) {
    case "OVERSPEED":
      return PENALTY_OVERSPEED;
    case "HARSH_BRAKING":
      return PENALTY_HARSH_BRAKING;
    default:
      // Delay reports and unknown reasons are informational, not scored.
      return 0;
  }
}

/** Scoring-relevant anomaly reasons (what the reconcile job counts). */
export function isScoringAnomaly(reason: string | null | undefined): boolean {
  return reason === "OVERSPEED" || reason === "HARSH_BRAKING";
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return SAFETY_SCORE_START;
  return Math.max(
    SAFETY_SCORE_FLOOR,
    Math.min(SAFETY_SCORE_CEILING, Math.round(value)),
  );
}

/**
 * Server-authoritative anomaly normalization for a telemetry ping — the
 * SINGLE classification authority for every ingest path.
 *
 * Phase 29 (F-TM-14): a fix whose horizontal accuracy fails the threshold
 * poisons every other measurement on that ping (speed included, since GPS
 * speed derives from the same fix), so LOW_ACCURACY takes PRECEDENCE and the
 * ping never scores. NULL accuracy means unknown — unknown ≠ bad, it passes
 * through to the normal path. Overspeed remains recomputed from speedKmh;
 * the client flag is never trusted for it. Harsh braking requires cross-ping
 * memory and relies on the client detector.
 */
export function derivePingAnomaly(input: {
  speedKmh?: number | null | undefined;
  accuracyMeters?: number | null | undefined;
  isOverspeed?: boolean | undefined;
  isHarshBraking?: boolean | undefined;
}): { isAnomaly: boolean; anomalyReason: string | null } {
  if (
    input.accuracyMeters != null &&
    input.accuracyMeters > MAX_PING_ACCURACY_METERS
  ) {
    return { isAnomaly: true, anomalyReason: "LOW_ACCURACY" };
  }
  const overspeed = (input.speedKmh ?? 0) > OVERSPEED_LIMIT_KMH;
  const harshBraking = input.isHarshBraking === true;
  if (overspeed) return { isAnomaly: true, anomalyReason: "OVERSPEED" };
  if (harshBraking) return { isAnomaly: true, anomalyReason: "HARSH_BRAKING" };
  return { isAnomaly: false, anomalyReason: null };
}

// ─── Marketplace trust badges (computed-on-read) ─────────────────────────────

export interface BadgeInputs {
  averageRating: number;
  totalReviews: number;
  safetyScore: number;
  totalTripsCompleted: number;
}

export type TrustBadge = "TOP_RATED" | "SAFE_DRIVER" | "VETERAN";

export const BADGE_THRESHOLDS = {
  TOP_RATED_RATING: 4.8,
  TOP_RATED_MIN_REVIEWS: 10,
  SAFE_DRIVER_MIN_SCORE: 95,
  VETERAN_MIN_TRIPS: 500,
} as const;

export function computeTrustBadges(inputs: BadgeInputs): TrustBadge[] {
  const badges: TrustBadge[] = [];
  if (
    inputs.averageRating >= BADGE_THRESHOLDS.TOP_RATED_RATING &&
    inputs.totalReviews >= BADGE_THRESHOLDS.TOP_RATED_MIN_REVIEWS
  ) {
    badges.push("TOP_RATED");
  }
  if (inputs.safetyScore >= BADGE_THRESHOLDS.SAFE_DRIVER_MIN_SCORE) {
    badges.push("SAFE_DRIVER");
  }
  if (inputs.totalTripsCompleted >= BADGE_THRESHOLDS.VETERAN_MIN_TRIPS) {
    badges.push("VETERAN");
  }
  return badges;
}
