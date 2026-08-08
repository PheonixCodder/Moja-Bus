import { toSafeDisplayNumber } from "@/lib/money";
import { getCalendarDateKey } from "@/lib/timezone";

export interface RevenueAnalyticsRow {
  day: Date;
  originCity: string | null;
  destCity: string | null;
  net: bigint;
  gross: bigint;
  bookingsCount: bigint;
  tripsCount: bigint;
}

export interface RevenueRouteEntry {
  routeLabel: string;
  totalNetXOF: number;
  bookingsCount: number;
  tripsCount: number;
  refundsCount: number;
}

export interface RevenueAggregation {
  grossRevenueXOF: number;
  netRevenueXOF: number;
  totalConfirmedBookings: number;
  timeSeriesMap: Map<string, { date: string; netXOF: number }>;
  routeMap: Map<string, RevenueRouteEntry>;
}

/**
 * Pure aggregator for the operator revenue-analytics rows. Used by
 * `getRevenueAnalytics` so the row-merging logic (including the handling of
 * archived/schedule-less trips, whose origin/dest cities resolve to "Unknown"
 * via the persisted booking trip-stops) is covered by a unit test.
 */
export function aggregateRevenueRows(
  rows: RevenueAnalyticsRow[],
): RevenueAggregation {
  let grossRevenueXOF = 0;
  let netRevenueXOF = 0;
  let totalConfirmedBookings = 0;

  const timeSeriesMap = new Map<string, { date: string; netXOF: number }>();
  const routeMap = new Map<string, RevenueRouteEntry>();

  for (const row of rows) {
    const net = toSafeDisplayNumber(row.net);
    const gross = toSafeDisplayNumber(row.gross);
    const bookings = toSafeDisplayNumber(row.bookingsCount);
    const trips = toSafeDisplayNumber(row.tripsCount);
    const routeLabel = `${row.originCity ?? "Unknown"} → ${row.destCity ?? "Unknown"}`;

    grossRevenueXOF += gross;
    netRevenueXOF += net;
    totalConfirmedBookings += bookings;

    const dateStr = getCalendarDateKey(new Date(row.day));
    const tsEntry = timeSeriesMap.get(dateStr) ?? { date: dateStr, netXOF: 0 };
    tsEntry.netXOF += net;
    timeSeriesMap.set(dateStr, tsEntry);

    const routeEntry =
      routeMap.get(routeLabel) ??
      ({
        routeLabel,
        totalNetXOF: 0,
        bookingsCount: 0,
        tripsCount: 0,
        refundsCount: 0,
      } as RevenueRouteEntry);
    routeEntry.totalNetXOF += net;
    routeEntry.bookingsCount += bookings;
    routeEntry.tripsCount += trips;
    routeMap.set(routeLabel, routeEntry);
  }

  return {
    grossRevenueXOF,
    netRevenueXOF,
    totalConfirmedBookings,
    timeSeriesMap,
    routeMap,
  };
}
