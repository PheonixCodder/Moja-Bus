/**
 * Africa/Abidjan (UTC+0, no DST) day/hour helpers for search (P2-12).
 * Stored departure times are absolute Instants; we interpret civil clock in Abidjan.
 */
export const SEARCH_TIME_ZONE = "Africa/Abidjan";

/** Civil YYYY-MM-DD in Africa/Abidjan for an Instant. */
export function abidjanDateKey(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SEARCH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/**
 * Instant range covering the Abidjan calendar day for `dateKey` (YYYY-MM-DD)
 * or for the Abidjan day containing `date`.
 */
export function abidjanDayBounds(date: Date | string): {
  startOfDay: Date;
  endOfDay: Date;
} {
  const key =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : abidjanDateKey(typeof date === "string" ? new Date(date) : date);

  // Abidjan is UTC+0 year-round — civil midnight == UTC midnight for that date.
  const startOfDay = new Date(`${key}T00:00:00.000Z`);
  const endOfDay = new Date(`${key}T23:59:59.999Z`);
  return { startOfDay, endOfDay };
}

/** Hour (0–23) in Africa/Abidjan for an Instant. */
export function abidjanHour(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SEARCH_TIME_ZONE,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(instant);
  const hour = parts.find((p) => p.type === "hour")?.value;
  return hour != null ? Number(hour) : instant.getUTCHours();
}
