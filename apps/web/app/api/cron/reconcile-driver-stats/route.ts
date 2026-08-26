import { getPrismaClient } from "@moja/db";
import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron-auth";
import {
  CLEAN_TRIP_CREDIT,
  CLEAN_TRIPS_PER_CREDIT,
  MAX_DAILY_PENALTY,
  SAFETY_SCORE_CEILING,
  SAFETY_SCORE_START,
} from "@/lib/driver-scoring";
import {
  computeSegmentDistanceKm,
  type ReconcileStopCoordinate,
} from "@/lib/telemetry-reconcile";

export const runtime = "nodejs";

/**
 * Phase 13 — Nightly authoritative stats reconciliation for every driver.
 *
 * Recomputes from source data (self-healing drift; first run = historical
 * backfill):
 *  - averageRating / totalReviews : mean of NON-NULL driverRatings only
 *  - totalDistanceKm              : Σ route distance over ARRIVED assignments —
 *                                   Phase 29 (F-TM-18): partial spans are scaled
 *                                   by the city-chain ratio instead of crediting
 *                                   RELIEF drivers the full route
 *  - safetyScore                  : 100 − Σ daily-capped penalties + clean-streak credit
 *
 * Phase 29 (F-TM-14): a trip counts toward the clean streak only when it has
 * at least one persisted ping AND zero penalized anomalies — zero-ping trips
 * no longer mint free clean-credit.
 *
 * Drivers with no scoring-relevant history are left untouched so manually
 * curated legacy values survive until real telemetry exists.
 */
export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();
  try {
    // ── 1. Daily-capped penalties per driver ──────────────────────────────
    // (Phase 29 ride-along: converted to tagged templates per F-IN-12 while
    // this file was being rewritten semantically. The old separate lifetime
    // query died with F-TM-18's dead variable — daily rows sum to it.)
    const pingCutoff = new Date();
    pingCutoff.setDate(pingCutoff.getDate() - 181);

    const dayRows: Array<{ driver: string; day: Date; pen: string | number }> =
      await prisma.$queryRaw`
        SELECT p."driverProfileId" AS driver,
               date_trunc('day', p."recordedAt") AS day,
               SUM(CASE p."anomalyReason"
                     WHEN 'OVERSPEED' THEN 5
                     WHEN 'HARSH_BRAKING' THEN 10
                     ELSE 0 END) AS pen
        FROM "driver_location_ping" p
        WHERE p."isAnomaly" = true
          AND p."anomalyReason" IN ('OVERSPEED','HARSH_BRAKING')
          AND p."recordedAt" >= ${pingCutoff}
        GROUP BY 1, 2
      `;

    const lifetimePenaltyByDriver = new Map<string, number>();
    for (const row of dayRows) {
      lifetimePenaltyByDriver.set(
        row.driver,
        (lifetimePenaltyByDriver.get(row.driver) ?? 0) +
          Math.min(MAX_DAILY_PENALTY, Number(row.pen ?? 0)),
      );
    }

    // ── 2. Distance over ARRIVED assignments ─────────────────────────────
    // Phase 29 (F-TM-18): segment-fair credit via computeSegmentDistanceKm —
    // sub-span assignments earn their chain RATIO × the stored road distance;
    // full-span and degenerate cases keep full-route credit.
    const assignments = await prisma.tripDriverAssignment.findMany({
      where: { trip: { status: "ARRIVED" } },
      select: {
        driverProfileId: true,
        startStopOrder: true,
        endStopOrder: true,
        trip: {
          select: {
            schedule: {
              select: { route: { select: { distanceKm: true } } },
            },
            tripStops: {
              orderBy: { stopOrder: "asc" as const },
              select: {
                stopOrder: true,
                terminal: {
                  select: {
                    cityRelation: {
                      select: { latitude: true, longitude: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const distanceByDriver = new Map<string, number>();
    let partialSpansScaled = 0;
    for (const assignment of assignments) {
      const routeDistanceKm = assignment.trip.schedule?.route?.distanceKm ?? 0;
      const stops: ReconcileStopCoordinate[] = assignment.trip.tripStops.map(
        (s) => ({
          stopOrder: s.stopOrder,
          latitude: s.terminal?.cityRelation?.latitude ?? null,
          longitude: s.terminal?.cityRelation?.longitude ?? null,
        }),
      );
      const credited = computeSegmentDistanceKm({
        startStopOrder: assignment.startStopOrder,
        endStopOrder: assignment.endStopOrder,
        stops,
        routeDistanceKm,
      });
      if (
        (assignment.endStopOrder != null || assignment.startStopOrder > 0) &&
        credited < routeDistanceKm
      ) {
        partialSpansScaled += 1;
      }
      distanceByDriver.set(
        assignment.driverProfileId,
        (distanceByDriver.get(assignment.driverProfileId) ?? 0) + credited,
      );
    }

    // ── 3. Ratings — non-null driverRatings only ─────────────────────────
    const ratingRows: Array<{
      driver: string;
      avg_r: string | number | null;
      cnt: string | number;
    }> = await prisma.$queryRaw`
      SELECT rv."driverId" AS driver,
             AVG(rv."driverRating") AS avg_r,
             COUNT(*)::int AS cnt
      FROM "review" rv
      WHERE rv."driverId" IS NOT NULL
        AND rv."driverRating" IS NOT NULL
      GROUP BY 1
    `;
    const ratingByDriver = new Map<string, { avg: number; count: number }>();
    for (const row of ratingRows) {
      ratingByDriver.set(row.driver, {
        avg: Number(row.avg_r ?? 0),
        count: Number(row.cnt ?? 0),
      });
    }

    // ── 4. Clean-streak credit (consecutive anomaly-free completed trips) ─
    // Phase 29 (F-TM-14): a clean trip requires BOTH at least one persisted
    // ping AND zero penalized anomalies — silent stretches no longer mint
    // credit, and LOW_ACCURACY flags neither dirty a trip nor score.
    const tripRows: Array<{
      driver: string;
      trip_id: string;
      has_pings: boolean;
      dirty: boolean;
    }> = await prisma.$queryRaw`
      SELECT a."driverProfileId" AS driver,
             t."id" AS trip_id,
      EXISTS (
                SELECT 1 FROM "driver_location_ping" p
                WHERE p."tripId" = t."id"
                  AND p."recordedAt" >= ${pingCutoff}
              ) AS has_pings,
              EXISTS (
                SELECT 1 FROM "driver_location_ping" p
                WHERE p."tripId" = t."id"
                  AND p."isAnomaly" = true
                  AND p."anomalyReason" IN ('OVERSPEED','HARSH_BRAKING')
                  AND p."recordedAt" >= ${pingCutoff}
              ) AS dirty
      FROM "trip_driver_assignment" a
      JOIN "trip" t ON t."id" = a."tripId"
      WHERE t."status" = 'ARRIVED'
      ORDER BY a."driverProfileId",
               t."actualArrival" DESC NULLS LAST,
               t."departureDate" DESC
    `;

    const streakByDriver = new Map<string, number>();
    const seenStreakEnd = new Set<string>();
    for (const row of tripRows) {
      if (seenStreakEnd.has(row.driver)) continue; // streak already broken
      if (!row.has_pings || row.dirty) {
        seenStreakEnd.add(row.driver); // current streak ends here
        continue;
      }
      streakByDriver.set(row.driver, (streakByDriver.get(row.driver) ?? 0) + 1);
    }

    // ── 5. Apply updates ─────────────────────────────────────────────────
    const affectedDriverIds = new Set<string>([
      ...lifetimePenaltyByDriver.keys(),
      ...distanceByDriver.keys(),
      ...ratingByDriver.keys(),
      ...streakByDriver.keys(),
    ]);

    const existingProfiles = await prisma.driverProfile.findMany({
      where: { id: { in: [...affectedDriverIds] } },
      select: { id: true, averageRating: true },
    });
    const existingAvg = new Map(
      existingProfiles.map((p) => [p.id, p.averageRating]),
    );

    let updated = 0;
    for (const driverId of affectedDriverIds) {
      const rating = ratingByDriver.get(driverId);
      const lifetimePenalty = lifetimePenaltyByDriver.get(driverId) ?? 0;
      const streak = streakByDriver.get(driverId) ?? 0;
      const cleanCredit =
        Math.floor(streak / CLEAN_TRIPS_PER_CREDIT) * CLEAN_TRIP_CREDIT;

      const nextScore = Math.max(
        0,
        Math.min(
          SAFETY_SCORE_CEILING,
          SAFETY_SCORE_START - lifetimePenalty + cleanCredit,
        ),
      );

      await prisma.driverProfile.update({
        where: { id: driverId },
        data: {
          averageRating: rating
            ? rating.avg
            : (existingAvg.get(driverId) ?? 5.0),
          totalReviews: rating?.count ?? 0,
          totalDistanceKm: distanceByDriver.get(driverId) ?? 0,
          safetyScore: nextScore,
        },
      });
      updated += 1;
    }

    return NextResponse.json({
      success: true,
      driversReconciled: updated,
      scoredWithPenalties: lifetimePenaltyByDriver.size,
      partialSpansScaled,
    });
  } catch (error) {
    console.error("reconcile-driver-stats failed:", error);
    return NextResponse.json(
      { error: "reconcile-driver-stats failed" },
      { status: 500 },
    );
  }
}
