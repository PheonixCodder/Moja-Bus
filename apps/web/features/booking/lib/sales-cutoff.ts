/**
 * Shared sales-cutoff rule for the passenger booking funnel (search listing,
 * trip details, seat map, and hold creation all enforce the same predicate).
 *
 * Sales close SALES_CUTOFF_MINUTES before departure: boarding starts early,
 * and a 15-min hold opened at the last second must expire at/before departure
 * so payment can never land on a bus that already left.
 *
 * Africa/Abidjan is UTC+0 year-round (see features/search/lib/abidjan-time.ts),
 * so direct Instant math is civil-correct — no timezone conversion needed.
 */

export const SALES_CUTOFF_MINUTES = 30;

const CUTOFF_MS = SALES_CUTOFF_MINUTES * 60 * 1000;

/**
 * Instant of the sales cutoff: departures before this instant are closed.
 * A trip is bookable iff `departureTime >= salesCutoffInstant(now)`.
 */
export function salesCutoffInstant(now: Date = new Date()): Date {
  return new Date(now.getTime() + CUTOFF_MS);
}

/** True once sales for this departure are closed (departure < now + cutoff). */
export function isPastSalesCutoff(
  departureTime: Date,
  now: Date = new Date(),
): boolean {
  return departureTime.getTime() < now.getTime() + CUTOFF_MS;
}
