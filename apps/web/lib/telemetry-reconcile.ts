import { calculateHaversineDistanceMeters } from "@/server/telemetry-validator";

/**
 * Phase 29 (F-TM-18) — segment-fair distance credit for partial
 * (RELIEF / sub-span) assignments in the nightly reconcile.
 *
 * Terminal locations carry no coordinates, but their City does — so the
 * chain is built over city centroids. Straight-line chaining systematically
 * understates road distance, which is why the helper computes a RATIO
 * (segment chain ÷ full-route chain) and multiplies the stored road
 * distanceKm: the route's own curvature calibration cancels the bias.
 *
 * Fallback is ALWAYS full-route credit (conservative, status quo) — never
 * punitive: missing coordinates, degenerate spans, or inverted orders all
 * degrade to what the reconcile credited before this existed. The proper fix
 * (per-stop cumulative distance column + backfill) stays roadmap.
 */

export interface ReconcileStopCoordinate {
  stopOrder: number;
  latitude: number | null;
  longitude: number | null;
}

function hasCoords(
  stop: ReconcileStopCoordinate,
): stop is ReconcileStopCoordinate & { latitude: number; longitude: number } {
  return stop.latitude != null && stop.longitude != null;
}

/** Sums haversine km over consecutive pairs; pairs missing coords contribute 0. */
function chainLengthKm(
  pairs: Array<[ReconcileStopCoordinate, ReconcileStopCoordinate]>,
): number {
  let total = 0;
  for (const [a, b] of pairs) {
    if (!hasCoords(a) || !hasCoords(b)) continue;
    total +=
      calculateHaversineDistanceMeters(
        a.latitude,
        a.longitude,
        b.latitude,
        b.longitude,
      ) / 1000;
  }
  return total;
}

export function computeSegmentDistanceKm(args: {
  startStopOrder: number;
  endStopOrder: number | null;
  stops: ReconcileStopCoordinate[];
  routeDistanceKm: number;
}): number {
  const { startStopOrder, endStopOrder, stops, routeDistanceKm } = args;

  // Full-span assignments (the PRIMARY default) keep full-route credit.
  // startStopOrder defaults to 0 rather than null, so "partial" must be
  // inferred as anything that narrows the span from either side.
  const partial = endStopOrder != null || startStopOrder > 0;
  if (!partial || !Number.isFinite(routeDistanceKm) || routeDistanceKm <= 0) {
    return routeDistanceKm;
  }
  if (endStopOrder != null && endStopOrder < startStopOrder) {
    return routeDistanceKm; // inverted span — unusable, stay conservative
  }

  const ordered = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
  const consecutivePairs: Array<
    [ReconcileStopCoordinate, ReconcileStopCoordinate]
  > = [];
  let prev: ReconcileStopCoordinate | undefined;
  for (const stop of ordered) {
    if (prev) consecutivePairs.push([prev, stop]);
    prev = stop;
  }

  const fullChain = chainLengthKm(consecutivePairs);
  if (fullChain <= 0) return routeDistanceKm;

  const segmentPairs = consecutivePairs.filter(([a, b]) => {
    const midA = (a.stopOrder + b.stopOrder) / 2;
    const upper = endStopOrder ?? Number.POSITIVE_INFINITY;
    return midA >= startStopOrder && midA <= upper;
  });
  const segmentChain = chainLengthKm(segmentPairs);

  const ratio = segmentChain / fullChain;
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return routeDistanceKm;
  }

  return Math.round(ratio * routeDistanceKm * 100) / 100;
}
