import {
  addAppCalendarDays,
  buildAppDepartureTimestamp,
  datesMatchCalendarDay,
  getWeekdayKey,
  isOnOrAfterCalendarDay,
  isOnOrBeforeCalendarDay,
  startOfAppCalendarDay,
  type WeekdayKey,
} from "./timezone";

export type CalendarWeekdays = Record<WeekdayKey, boolean>;

export type ServiceCalendarLike = CalendarWeekdays & {
  validFrom: Date;
  validUntil: Date | null;
};

export type ServiceExceptionLike = {
  date: Date;
  type: "CANCELLED" | "EXTRA_SERVICE" | "MODIFIED";
  overrideDepartureTime?: string | null;
};

export type CandidateDeparture = {
  calendarDay: Date;
  departureTimestamp: Date;
  hours: number;
  minutes: number;
  exceptionType: ServiceExceptionLike["type"] | null;
};

function parseHhMm(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(":");
  return {
    hours: parseInt(h || "0", 10),
    minutes: parseInt(m || "0", 10),
  };
}

/**
 * Shared source of truth for which departures exist in a rolling window.
 * Window = app-timezone today … today+daysCount-1 (inclusive start, daysCount days).
 */
export function getCandidateDepartureDates(params: {
  departureTime: string;
  calendar: ServiceCalendarLike;
  exceptions?: ServiceExceptionLike[];
  daysCount?: number;
  now?: Date;
}): CandidateDeparture[] {
  const {
    departureTime,
    calendar,
    exceptions = [],
    daysCount = 14,
    now = new Date(),
  } = params;

  const defaultTime = parseHhMm(departureTime);
  const today = startOfAppCalendarDay(now);
  const results: CandidateDeparture[] = [];

  for (let i = 0; i < daysCount; i++) {
    const calendarDay = addAppCalendarDays(today, i);
    const weekday = getWeekdayKey(calendarDay);
    const runsOnWeekday = calendar[weekday] === true;

    const exception =
      exceptions.find((e) => datesMatchCalendarDay(e.date, calendarDay)) ??
      null;

    if (exception?.type === "CANCELLED") {
      continue;
    }

    const forceExtra = exception?.type === "EXTRA_SERVICE";
    if (!runsOnWeekday && !forceExtra) {
      continue;
    }

    if (!isOnOrAfterCalendarDay(calendarDay, calendar.validFrom)) {
      continue;
    }
    if (
      calendar.validUntil &&
      !isOnOrBeforeCalendarDay(calendarDay, calendar.validUntil)
    ) {
      continue;
    }

    let hours = defaultTime.hours;
    let minutes = defaultTime.minutes;
    if (
      exception?.type === "MODIFIED" &&
      exception.overrideDepartureTime &&
      /^([01]\d|2[0-3]):([0-5]\d)$/.test(exception.overrideDepartureTime)
    ) {
      const override = parseHhMm(exception.overrideDepartureTime);
      hours = override.hours;
      minutes = override.minutes;
    }

    results.push({
      calendarDay,
      departureTimestamp: buildAppDepartureTimestamp(
        calendarDay,
        hours,
        minutes,
      ),
      hours,
      minutes,
      exceptionType: exception?.type ?? null,
    });
  }

  return results;
}

/** Preview helper: same window rules as generation (for UI calendars). */
export function getPreviewDepartureDateStrings(params: {
  departureTime: string;
  calendar: ServiceCalendarLike;
  exceptions?: ServiceExceptionLike[];
  daysCount?: number;
  now?: Date;
}): string[] {
  return getCandidateDepartureDates(params).map((c) =>
    c.calendarDay.toISOString().slice(0, 10),
  );
}
