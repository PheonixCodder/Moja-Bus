import type { Prisma } from "@moja/db";
import type { TripStatus } from "@moja/schemas";
import {
  endOfAppCalendarDay,
  getAppRollingTripWindow,
  getCalendarDateKey,
  OPERATOR_TRIP_BOARD_DAYS,
  startOfAppCalendarDay,
} from "@/lib/timezone";

export type OperatorTripBoardFilters = {
  companyId: string;
  /** When set, list is status-scoped. Omit for statusCounts groupBy. */
  status?: TripStatus | undefined;
  serviceType?: "INTERCITY" | "URBAN" | undefined;
  scheduleId?: string | undefined;
  routeId?: string | undefined;
  q?: string | undefined;
  /** YYYY-MM-DD calendar day in app timezone */
  startDate?: string | undefined;
  /** YYYY-MM-DD calendar day in app timezone (inclusive end-of-day) */
  endDate?: string | undefined;
  /**
   * Driver dossier history mode: no rolling date window.
   * Used by trips.list only.
   */
  driverProfileId?: string | undefined;
  now?: Date | undefined;
};

export type OperatorTripBoardWhereResult = {
  where: Prisma.TripWhereInput;
  /** Null when driverProfileId full-history mode skips the board window. */
  window: { startDate: string; endDate: string } | null;
};

/** Parse YYYY-MM-DD (or any Date-parsable string) to Abidjan day start/end. */
export function parseAppCalendarDayBound(
  dateStr: string,
  bound: "start" | "end",
): Date {
  const trimmed = dateStr.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const anchor = m
    ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0))
    : new Date(trimmed);
  if (Number.isNaN(anchor.getTime())) {
    const fallback = startOfAppCalendarDay(new Date());
    return bound === "start" ? fallback : endOfAppCalendarDay(fallback);
  }
  return bound === "start"
    ? startOfAppCalendarDay(anchor)
    : endOfAppCalendarDay(anchor);
}

function tripSearchOr(q: string): Prisma.TripWhereInput[] {
  return [
    { id: { contains: q, mode: "insensitive" } },
    {
      bus: {
        registrationPlate: { contains: q, mode: "insensitive" },
      },
    },
    {
      schedule: {
        route: {
          OR: [
            {
              originTerminal: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { city: { contains: q, mode: "insensitive" } },
                  {
                    cityRelation: {
                      name: { contains: q, mode: "insensitive" },
                    },
                  },
                ],
              },
            },
            {
              destTerminal: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { city: { contains: q, mode: "insensitive" } },
                  {
                    cityRelation: {
                      name: { contains: q, mode: "insensitive" },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
  ];
}

/**
 * Shared Prisma where for operator dispatch `trips.list` and `trips.statusCounts`
 * so chip badges and the trip list cannot drift (DISP-001 / DISP-004 / DISP-006).
 */
export function buildOperatorTripWhere(
  input: OperatorTripBoardFilters,
): OperatorTripBoardWhereResult {
  const where: Prisma.TripWhereInput = {
    companyId: input.companyId,
    archivedAt: null,
  };

  let window: OperatorTripBoardWhereResult["window"] = null;

  if (input.driverProfileId) {
    where.driverAssignments = {
      some: { driverProfileId: input.driverProfileId },
    };
  } else {
    const rolling = getAppRollingTripWindow(
      OPERATOR_TRIP_BOARD_DAYS,
      input.now ?? new Date(),
    );
    const startDate = input.startDate
      ? parseAppCalendarDayBound(input.startDate, "start")
      : rolling.startDate;
    const endDate = input.endDate
      ? parseAppCalendarDayBound(input.endDate, "end")
      : rolling.endDate;
    where.departureDate = { gte: startDate, lte: endDate };
    window = {
      startDate: getCalendarDateKey(startDate),
      endDate: getCalendarDateKey(endDate),
    };
  }

  if (input.status) {
    where.status = input.status;
  }
  if (input.serviceType) {
    where.serviceType = input.serviceType;
  }
  if (input.scheduleId) {
    where.scheduleId = input.scheduleId;
  }
  if (input.routeId) {
    where.schedule = { routeId: input.routeId };
  }

  const q = input.q?.trim();
  if (q) {
    where.OR = tripSearchOr(q);
  }

  return { where, window };
}

export function sumStatusCounts(counts: Record<string, number>): number {
  let total = 0;
  for (const n of Object.values(counts)) {
    total += n;
  }
  return total;
}
