export const APP_TIMEZONE = "Africa/Abidjan";

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
};

function getFormatter() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}

export function getZonedDateParts(date: Date): ZonedDateParts {
  const parts = getFormatter().formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const weekdayLabel = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const weekday = WEEKDAY_TO_INDEX[weekdayLabel] ?? 0;

  return { year, month, day, weekday };
}

/** Calendar date key YYYY-MM-DD in the app timezone. */
export function getCalendarDateKey(date: Date): string {
  const { year, month, day } = getZonedDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Midnight UTC for a calendar day in Abidjan (UTC+0). */
export function startOfAppCalendarDay(date: Date): Date {
  const { year, month, day } = getZonedDateParts(date);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function addAppCalendarDays(date: Date, days: number): Date {
  const start = startOfAppCalendarDay(date);
  start.setUTCDate(start.getUTCDate() + days);
  return start;
}

export function buildAppDepartureTimestamp(
  calendarDay: Date,
  hours: number,
  minutes: number,
): Date {
  const { year, month, day } = getZonedDateParts(calendarDay);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
}

export function isOnOrAfterCalendarDay(
  candidate: Date,
  bound: Date,
): boolean {
  return getCalendarDateKey(candidate) >= getCalendarDateKey(bound);
}

export function isOnOrBeforeCalendarDay(
  candidate: Date,
  bound: Date,
): boolean {
  return getCalendarDateKey(candidate) <= getCalendarDateKey(bound);
}

export function datesMatchCalendarDay(a: Date, b: Date): boolean {
  return getCalendarDateKey(a) === getCalendarDateKey(b);
}

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export function getWeekdayKey(date: Date): WeekdayKey {
  return WEEKDAY_KEYS[getZonedDateParts(date).weekday]!;
}
