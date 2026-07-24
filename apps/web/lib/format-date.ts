/**
 * Centralized Application Date & Time Formatting Utilities.
 *
 * All dates and times are rendered in Africa/Abidjan (UTC+0 / WAT) to guarantee
 * 100% consistency across server (SSR) and client (browser) rendering.
 * Always import from this module instead of ad-hoc calls to `toLocaleDateString()`
 * or `toLocaleTimeString()`.
 */

export const APP_TIMEZONE = "Africa/Abidjan";

/** e.g. "Jul 16, 2026" */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** e.g. "Jul 16, 2026 at 09:30 AM" */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** e.g. "Jul 16" */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
  }).format(d);
}

/** e.g. "09:30 AM" */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Legacy admin aliases for backward compatibility */
export const formatAdminDate = formatDate;
export const formatAdminDateTime = formatDateTime;
export const formatAdminDateShort = formatDateShort;
export const formatAdminTime = formatTime;

/** Format departure time consistently */
export const formatDepartureTime = formatTime;
