import type { Prisma, PrismaClient } from "@moja/db";
import type { GeoPlace } from "../lib/places";
import type { SearchFilters } from "../services/search-service";

export type TripWhereFilters = Pick<
  SearchFilters,
  "operators" | "amenities" | "departureTime" | "seatClass"
>;

const AMENITY_TO_FIELD: Record<string, string> = {
  AC: "hasAC",
  WIFI: "hasWifi",
  TOILET: "hasToilet",
  LUGGAGE: "hasLuggage",
};

function terminalWhere(place: GeoPlace): Prisma.CompanyLocationWhereInput {
  return {
    cityId: place.cityId,
    ...(place.municipalityId ? { municipalityId: place.municipalityId } : {}),
    ...(place.quarterId ? { quarterId: place.quarterId } : {}),
  };
}

/**
 * Maps a departure window to concrete UTC hour ranges relative to the given
 * start-of-day. Mirrors the JS predicate in search-service (uses UTC hours,
 * upper bound exclusive so `lt` matches `hour < X` semantics).
 */
function departureHourRanges(
  window: string,
  startOfDay: Date,
): { gte: Date; lt: Date }[] {
  const at = (h: number) => {
    const d = new Date(startOfDay);
    d.setUTCHours(h, 0, 0, 0);
    return d;
  };
  switch (window) {
    case "MORNING":
      return [{ gte: at(5), lt: at(12) }];
    case "AFTERNOON":
      return [{ gte: at(12), lt: at(17) }];
    case "EVENING":
      return [{ gte: at(17), lt: at(22) }];
    case "LATE_NIGHT":
      return [
        { gte: at(22), lt: at(24) },
        { gte: at(0), lt: at(5) },
      ];
    default:
      return [];
  }
}

/**
 * Builds a TripWhereInput from geo/date constraints plus the SQL-expressible
 * filters. Fare-derived filters (maxPrice, isExpress) are intentionally not
 * here — they depend on segment stop-order resolution and stay in JS.
 */
export function buildTripWhere(
  originPlace: GeoPlace,
  destinationPlace: GeoPlace,
  start: Date,
  end: Date,
  filters: TripWhereFilters,
): Prisma.TripWhereInput {
  const where: Prisma.TripWhereInput = {
    status: { in: ["SCHEDULED", "DELAYED"] },
    schedule: { isActive: true },
  };

  if (filters.operators && filters.operators.length > 0) {
    where.companyId = { in: filters.operators };
  }

  const busWhere: Prisma.BusWhereInput = {};
  if (filters.seatClass && filters.seatClass.length > 0) {
    busWhere.seatClass = { in: filters.seatClass };
  }
  if (filters.amenities && filters.amenities.length > 0) {
    const layoutFlags: Record<string, boolean> = {};
    for (const a of filters.amenities) {
      const field = AMENITY_TO_FIELD[a];
      if (field) layoutFlags[field] = true;
    }
    if (Object.keys(layoutFlags).length > 0) {
      busWhere.layoutTemplate = { is: layoutFlags };
    }
  }
  if (Object.keys(busWhere).length > 0) {
    where.bus = busWhere;
  }

  const originStopWhere: Prisma.TripStopWhereInput = {
    terminal: terminalWhere(originPlace),
    isPickup: true,
  };

  if (filters.departureTime && filters.departureTime.length > 0) {
    const hourBranches: Prisma.TripStopWhereInput[] = [];
    for (const window of filters.departureTime) {
      for (const range of departureHourRanges(window, start)) {
        hourBranches.push({
          ...originStopWhere,
          scheduledDeparture: { gte: range.gte, lt: range.lt },
        });
      }
    }
    where.tripStops = { some: { OR: hourBranches } };
  } else {
    where.tripStops = {
      some: {
        ...originStopWhere,
        scheduledDeparture: { gte: start, lte: end },
      },
    };
  }

  where.AND = {
    tripStops: {
      some: {
        terminal: terminalWhere(destinationPlace),
        isDropoff: true,
      },
    },
  };

  return where;
}

export class TripSearchReadRepository {
  constructor(private prisma: PrismaClient) {}

  private readonly tripInclude = {
    company: true,
    bus: {
      include: {
        busType: true,
        layoutTemplate: true,
      },
    },
    tripStops: {
      include: {
        terminal: {
          include: { cityRelation: true, municipality: true, quarter: true },
        },
      },
      orderBy: { stopOrder: "asc" },
    },
    schedule: {
      include: {
        fares: {
          where: { isActive: true },
        },
      },
    },
  } as const;

  private dayBounds(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }

  /**
   * Finds trips on a given day between two level-aware places (city,
   * municipality, or quarter — matched at the deepest level given).
   * Note: Enforcing the stop order index (origin < destination) is handled
   * during pipeline orchestration.
   */
  async findTrips(
    originPlace: GeoPlace,
    destinationPlace: GeoPlace,
    date: Date,
    filters: TripWhereFilters = {
      operators: [],
      amenities: [],
      departureTime: [],
      seatClass: undefined,
    },
  ) {
    const { startOfDay, endOfDay } = this.dayBounds(date);

    return this.prisma.trip.findMany({
      where: buildTripWhere(
        originPlace,
        destinationPlace,
        startOfDay,
        endOfDay,
        filters,
      ),
      include: this.tripInclude,
    });
  }

  /**
   * Same place matching as findTrips but over a date window, with a lean
   * include (no seats/company/bus) — used by the cheapest-by-date strip.
   */
  async findTripsInWindow(
    originPlace: GeoPlace,
    destinationPlace: GeoPlace,
    windowStart: Date,
    windowEnd: Date,
  ) {
    return this.prisma.trip.findMany({
      where: buildTripWhere(
        originPlace,
        destinationPlace,
        windowStart,
        windowEnd,
        {
          operators: [],
          amenities: [],
          departureTime: [],
          seatClass: undefined,
        },
      ),
      include: {
        tripStops: {
          include: {
            terminal: {
              select: { cityId: true, municipalityId: true, quarterId: true },
            },
          },
          orderBy: { stopOrder: "asc" },
        },
        schedule: {
          include: {
            fares: {
              where: { isActive: true },
            },
          },
        },
      },
    });
  }

  /**
   * Computes the number of occupied seats per trip for their specific segment stop ranges.
   * An active lock (PENDING_PAYMENT) is counted if it hasn't expired yet.
   */
  async getSegmentOccupancy(
    candidateTrips: {
      id: string;
      searchOriginOrder: number;
      searchDestinationOrder: number;
    }[],
  ) {
    if (candidateTrips.length === 0) {
      return new Map<string, number>();
    }

    const activeHoldsThreshold = new Date();

    const tripConditions = candidateTrips.map((trip) => ({
      tripId: trip.id,
      boardingStopOrder: { lt: trip.searchDestinationOrder },
      dropoffStopOrder: { gt: trip.searchOriginOrder },
    }));

    const [confirmedCounts, pendingCounts] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ["tripId"],
        where: { OR: tripConditions, status: "CONFIRMED" },
        _count: { seatId: true },
      }),
      this.prisma.booking.groupBy({
        by: ["tripId"],
        where: {
          OR: tripConditions,
          status: "PENDING_PAYMENT",
          holdExpiresAt: { gt: activeHoldsThreshold },
        },
        _count: { seatId: true },
      }),
    ]);

    const occupancy = new Map<string, number>();
    for (const c of confirmedCounts) {
      occupancy.set(c.tripId, (occupancy.get(c.tripId) ?? 0) + c._count.seatId);
    }
    for (const c of pendingCounts) {
      occupancy.set(c.tripId, (occupancy.get(c.tripId) ?? 0) + c._count.seatId);
    }

    return occupancy;
  }
}
