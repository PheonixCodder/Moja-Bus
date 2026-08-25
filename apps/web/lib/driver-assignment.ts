import {
  DRIVER_TURNAROUND_BUFFER_MINUTES,
  INTERCITY_TRIP_DEFAULT_MINUTES,
  URBAN_TRIP_DEFAULT_MINUTES,
} from "@moja/schemas";

/**
 * Phase 12 — Driver double-booking engine.
 *
 * Computes a driver assignment interval per trip and detects overlaps across
 * ALL companies (urban contractors may hold affiliations with several
 * operators simultaneously). A turnaround buffer separates consecutive runs.
 */

/**
 * Conservative effective speed for duration estimation when a trip has no
 * computed arrival (legacy rows). Slower-than-reality on purpose: an
 * over-long busy window blocks a borderline assignment safely, while an
 * under-estimate would silently allow double-bookings.
 */
const FALLBACK_EFFECTIVE_SPEED_KMH = 35;

export function driverInterval(
  departureDate: Date,
  estimatedArrival: Date | null | undefined,
  serviceType: string,
  routeDistanceKm?: number | null,
): { startMs: number; endMs: number } {
  const startMs = new Date(departureDate).getTime();
  const fallbackMinutes =
    serviceType === "URBAN"
      ? URBAN_TRIP_DEFAULT_MINUTES
      : INTERCITY_TRIP_DEFAULT_MINUTES;
  const endMs = estimatedArrival
    ? new Date(estimatedArrival).getTime()
    : routeDistanceKm && routeDistanceKm > 0
      ? startMs +
        (routeDistanceKm / FALLBACK_EFFECTIVE_SPEED_KMH) * 60 * 60 * 1000
      : startMs + fallbackMinutes * 60 * 1000;
  return { startMs, endMs };
}

export type DriverTripConflict = {
  tripId: string;
  routeName: string;
  companyName: string;
  busyUntilIso: string;
};

/** One pre-fetched assignment row handed to findTripConflict (Phase 27). */
export type TripConflictCandidate = {
  tripId: string;
  departureDate: Date;
  estimatedArrival: Date | null | undefined;
  serviceType: string | null | undefined;
  routeDistanceKm: number | null | undefined;
  originCity: string | null | undefined;
  destCity: string | null | undefined;
  routeName: string | null | undefined;
  plate: string | null | undefined;
  companyName: string | null | undefined;
};

/**
 * Phase 27 (F-OP-14) — the interval-overlap core shared by BOTH query
 * strategies (single-driver scan and roster-batch scan): one math source for
 * buffer semantics and conflict selection, so the two paths can never
 * silently diverge. Candidates are consumed in the order given — callers pass
 * deterministic order (departure asc, id asc).
 */
export function findTripConflict(
  target: { startMs: number; endMs: number },
  candidates: TripConflictCandidate[],
): DriverTripConflict | null {
  const bufferMs = DRIVER_TURNAROUND_BUFFER_MINUTES * 60 * 1000;
  for (const row of candidates) {
    const existing = driverInterval(
      row.departureDate,
      row.estimatedArrival ?? null,
      row.serviceType ?? "INTERCITY",
      row.routeDistanceKm ?? null,
    );
    const overlaps =
      target.startMs < existing.endMs + bufferMs &&
      existing.startMs < target.endMs + bufferMs;
    if (overlaps) {
      const label =
        row.originCity && row.destCity
          ? `${row.originCity}→${row.destCity}`
          : (row.routeName ?? row.plate ?? "un autre trajet");
      return {
        tripId: row.tripId,
        routeName: label,
        companyName: row.companyName ?? "",
        busyUntilIso: new Date(existing.endMs + bufferMs).toISOString(),
      };
    }
  }
  return null;
}

/**
 * Non-throwing double-booking check — returns the conflicting trip descriptor
 * or null. Scans cross-company; excludes cancelled/archived trips and the
 * target trip itself when excludeTripId is provided.
 */
export async function getDriverTripConflict(
  prisma: any,
  driverProfileId: string,
  opts: {
    departureDate: Date;
    estimatedArrival?: Date | null;
    serviceType: string;
    routeDistanceKm?: number | null;
    excludeTripId?: string;
  },
): Promise<DriverTripConflict | null> {
  const target = driverInterval(
    opts.departureDate,
    opts.estimatedArrival,
    opts.serviceType,
    opts.routeDistanceKm ?? null,
  );

  const windowStart = new Date(target.startMs - 16 * 60 * 60 * 1000);
  const windowEnd = new Date(target.endMs + 16 * 60 * 60 * 1000);

  const candidates = await prisma.tripDriverAssignment.findMany({
    where: {
      driverProfileId,
      ...(opts.excludeTripId ? { tripId: { not: opts.excludeTripId } } : {}),
      trip: {
        status: { in: ["SCHEDULED", "BOARDING", "DEPARTED", "DELAYED"] },
        archivedAt: null,
        departureDate: { gte: windowStart, lte: windowEnd },
      },
    },
    // Phase 27 (F-OP-14) — deterministic candidate order: soonest departure
    // first, id as tiebreaker. Which conflict wins a multi-overlap scan must
    // not depend on heap/insertion order.
    orderBy: [{ trip: { departureDate: "asc" } }, { id: "asc" }],
    select: {
      tripId: true,
      trip: {
        select: {
          id: true,
          departureDate: true,
          estimatedArrival: true,
          serviceType: true,
          company: { select: { name: true } },
          schedule: {
            select: {
              route: {
                select: {
                  name: true,
                  distanceKm: true,
                  originTerminal: {
                    select: {
                      cityRelation: { select: { name: true } },
                      name: true,
                    },
                  },
                  destTerminal: {
                    select: {
                      cityRelation: { select: { name: true } },
                      name: true,
                    },
                  },
                },
              },
            },
          },
          bus: { select: { registrationPlate: true } },
        },
      },
    },
    take: 50,
  });

  return findTripConflict(
    target,
    candidates.map((row: any) => ({
      tripId: row.trip.id,
      departureDate: row.trip.departureDate,
      estimatedArrival: row.trip.estimatedArrival,
      serviceType: row.trip.serviceType,
      routeDistanceKm: row.trip.schedule?.route?.distanceKm ?? null,
      // Label parity with the pre-refactor path: city names come from
      // cityRelation ONLY (never bare terminal names).
      originCity:
        row.trip.schedule?.route?.originTerminal?.cityRelation?.name ?? null,
      destCity:
        row.trip.schedule?.route?.destTerminal?.cityRelation?.name ?? null,
      routeName: row.trip.schedule?.route?.name ?? null,
      plate: row.trip.bus?.registrationPlate ?? null,
      companyName: row.trip.company?.name ?? null,
    })),
  );
}
