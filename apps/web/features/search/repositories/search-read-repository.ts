import type { Prisma, PrismaClient } from "@moja/db";
import type { GeoPlace } from "../lib/places";
import type { SearchFilters } from "../services/search-service";
import { abidjanDayBounds } from "../lib/abidjan-time";
import { salesCutoffInstant } from "@/features/booking/lib/sales-cutoff";

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
 * Maps a departure window to hour ranges relative to Abidjan start-of-day
 * (UTC+0, no DST — civil hours == UTC for that date). Upper bound exclusive.
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
 *
 * `now` applies the shared sales cutoff (features/booking/lib/sales-cutoff.ts):
 * every lower bound used for the queried window is clamped up to
 * now + SALES_CUTOFF_MINUTES so already-departed departures can never match,
 * including inside the departure-window (MORNING/LATE_NIGHT/…) branches which
 * carry their own absolute ranges. Omitted = no clamping (pure builder; unit
 * tests pin exact windows). A fully-past window yields gte > lte → zero rows.
 */
export function buildTripWhere(
  originPlace: GeoPlace,
  destinationPlace: GeoPlace,
  start: Date,
  end: Date,
  filters: TripWhereFilters,
  now?: Date,
): Prisma.TripWhereInput {
  const where: Prisma.TripWhereInput = {
    // BOARDING matches trip-details bookable set (P2-11): seats may remain
    // for later segments while the bus has already started boarding.
    status: { in: ["SCHEDULED", "DELAYED", "BOARDING"] },
    schedule: { isActive: true },
  };

  const cutoff = now ? salesCutoffInstant(now) : null;
  const effectiveStart =
    cutoff && cutoff.getTime() > start.getTime() ? cutoff : start;


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
        const gte = range.gte < effectiveStart ? effectiveStart : range.gte;
        if (range.lt <= gte) continue; // window fully closed by the cutoff
        hourBranches.push({
          ...originStopWhere,
          scheduledDeparture: { gte, lt: range.lt },
        });
      }
    }
    if (hourBranches.length === 0) {
      // Every selected window closed before the cutoff — force an impossible
      // condition rather than an empty OR (whose matching behavior is subtle).
      where.tripStops = {
        some: {
          ...originStopWhere,
          scheduledDeparture: { gte: effectiveStart, lt: effectiveStart },
        },
      };
    } else {
      where.tripStops = { some: { OR: hourBranches } };
    }
  } else {
    where.tripStops = {
      some: {
        ...originStopWhere,
        scheduledDeparture: { gte: effectiveStart, lte: end },
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

  /** P2-12: civil day in Africa/Abidjan (not browser/UTC local). */
  private dayBounds(date: Date) {
    return abidjanDayBounds(date);
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
        new Date(),
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
        new Date(),
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
   * Occupied seats for a search segment = max concurrent load across stop
   * intervals (distinct seatIds), not overlapping booking row count (P1-3).
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

    const { maxPathOccupancy } = await import(
      "@/features/booking/lib/max-path-occupancy"
    );

    const activeHoldsThreshold = new Date();
    const tripConditions = candidateTrips.map((trip) => ({
      tripId: trip.id,
      boardingStopOrder: { lt: trip.searchDestinationOrder },
      dropoffStopOrder: { gt: trip.searchOriginOrder },
    }));

    const bookings = await this.prisma.booking.findMany({
      where: {
        AND: [
          { OR: tripConditions },
          {
            OR: [
              { status: "CONFIRMED" },
              {
                status: "PENDING_PAYMENT",
                holdExpiresAt: { gt: activeHoldsThreshold },
              },
            ],
          },
        ],
      },
      select: {
        tripId: true,
        seatId: true,
        boardingStopOrder: true,
        dropoffStopOrder: true,
      },
    });

    const byTrip = new Map<
      string,
      {
        seatId: string;
        boardingStopOrder: number;
        dropoffStopOrder: number;
      }[]
    >();
    for (const b of bookings) {
      const list = byTrip.get(b.tripId) ?? [];
      list.push({
        seatId: b.seatId,
        boardingStopOrder: b.boardingStopOrder,
        dropoffStopOrder: b.dropoffStopOrder,
      });
      byTrip.set(b.tripId, list);
    }

    const occupancy = new Map<string, number>();
    for (const trip of candidateTrips) {
      const seats = byTrip.get(trip.id) ?? [];
      occupancy.set(
        trip.id,
        maxPathOccupancy(
          seats,
          trip.searchOriginOrder,
          trip.searchDestinationOrder,
        ),
      );
    }

    return occupancy;
  }
}
