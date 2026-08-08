/**
 * Shared destination-arrival computation for generated and manually-created trips.
 *
 * The destination stop is NOT a `RouteWaypoint`, so its arrival time must be derived
 * rather than read off a `ScheduleWaypoint` timing row. This module centralises that
 * derivation so `trip-generator.ts` (bulk) and `trips.ts` (manual create) stay in sync —
 * previously each duplicated a `lastTiming?.departureOffsetMinutes ?? 0` formula that
 * produced `0h 0m` for direct routes and dropped the final-leg travel time for routes
 * with waypoints (the OT1 "0h 0m everywhere" bug).
 *
 * Derivation model (consistent with `computeScheduleWaypoints`, which budgets the
 * full-route fare's `durationMinutes` across waypoint legs):
 *  - Direct route (no waypoints): the full-route fare duration IS the origin->destination
 *    travel time.
 *  - Route with waypoints: destination arrival = last waypoint departure + the final-leg
 *    travel (last waypoint -> destination terminal). The final-leg travel is the residual
 *    of the full-route duration budget after the waypoint legs have consumed their
 *    share, which is totalDuration-preserving and exact regardless of whether waypoint
 *    legs used explicit segment fares or proportional allocation.
 */

export interface DestinationArrivalWaypoint {
  id: string;
  stopOrder: number;
}

export interface DestinationArrivalTiming {
  arrivalOffsetMinutes: number | null;
  departureOffsetMinutes: number | null;
}

export interface DestinationArrivalInput {
  /** Route waypoints, sorted/used by `stopOrder`. */
  waypoints: ReadonlyArray<DestinationArrivalWaypoint>;
  /** `ScheduleWaypoint` timing keyed by the route waypoint id. */
  timings: ReadonlyMap<string, DestinationArrivalTiming>;
  /** `durationMinutes` of the active full-route fare (fromStopOrder 0 -> destination). */
  fullRouteDurationMin: number | null;
}

/**
 * Returns the offset (in minutes) from origin departure to the destination
 * `scheduledArrival`/`scheduledDeparture` and `Trip.estimatedArrival`.
 */
export function computeDestinationArrivalOffset(
  input: DestinationArrivalInput,
): number {
  const { waypoints, timings, fullRouteDurationMin } = input;
  const duration = fullRouteDurationMin ?? 0;

  // Direct route: origin -> destination is a single leg. The full-route fare's
  // duration is the total travel time.
  if (waypoints.length === 0) {
    return duration;
  }

  const sorted = [...waypoints].sort((a, b) => a.stopOrder - b.stopOrder);
  const last = sorted[sorted.length - 1]!;
  const lastTiming = timings.get(last.id);
  const lastArrival = lastTiming?.arrivalOffsetMinutes ?? 0;
  const lastDeparture = lastTiming?.departureOffsetMinutes ?? lastArrival;

  // Final leg (last waypoint -> destination) = whatever of the full-route duration
  // budget the waypoint legs did not consume. Non-negative by construction.
  const finalLegTravel = Math.max(0, duration - lastArrival);
  return lastDeparture + finalLegTravel;
}
