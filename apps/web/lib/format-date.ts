/**
 * Shared admin date formatting utilities.
 *
 * All admin dates are rendered in Africa/Abidjan (UTC+0 / WAT) to prevent
 * hydration mismatches between server (system TZ) and browser (local TZ).
 * Always import from this file instead of calling toLocaleDateString() directly.
 */

const ADMIN_TIMEZONE = "Africa/Abidjan";

/** e.g. "Jul 16, 2026" */
export function formatAdminDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ADMIN_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/** e.g. "Jul 16, 2026 at 09:30 AM" */
export function formatAdminDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ADMIN_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** e.g. "Jul 16" */
export function formatAdminDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ADMIN_TIMEZONE,
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/** e.g. "09:30 AM" */
export function formatAdminTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ADMIN_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
