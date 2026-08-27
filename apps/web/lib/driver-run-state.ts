import type { PrismaClient } from "@moja/db";

/**
 * Phase 06 (F-DV-04) — driver run-state lifecycle ownership.
 *
 * `DriverProfile.currentTripId` used to be written by exactly two flows
 * (drivers.startTrip / drivers.completeTrip). Every run that ended outside
 * the driver's own hands — operator arrival on the dispatch board, trip
 * cancellation through schedules/service exceptions, verification
 * SUSPEND/REJECT — left drivers stranded ON_TRIP forever with ghost buses
 * persisting in getLivePositions (which filters on status ON_TRIP/ON_DUTY).
 *
 * These helpers are the single convergence point every such flow must call
 * inside its transaction. Lock order follows the P2-8 convention: callers
 * already hold the trip row; these writes only touch the driver rows.
 */

type DriverRunStateDb = PrismaClient | any;

export type PostRunStatus = "AVAILABLE" | "OFFLINE";

/**
 * Where a driver lands when a run ends without their own Complete Run tap:
 * still on an open shift → AVAILABLE (idle, ready for the next dispatch);
 * no open shift → OFFLINE. Mirrors toggleShift semantics.
 */
export function resolvePostRunStatus(hasOpenShift: boolean): PostRunStatus {
  return hasOpenShift ? "AVAILABLE" : "OFFLINE";
}

/**
 * Converge every driver whose currentTripId points at a run that was finished
 * from the outside (operator ARRIVED or CANCELLED): clears currentTripId and
 * forces AVAILABLE/OFFLINE per open-shift state, so no ghost bus survives on
 * the fleet map.
 *
 * Keyed on currentTripId — not trip.driverId — because ANY assigned role
 * (PRIMARY/RELIEF/CONDUCTOR) may hold it after startTrip. Unconditional and
 * idempotent: trips nobody started are a no-op.
 *
 * Returns the affected driver profile ids so callers can layer extras (e.g.
 * totalTripsCompleted credit) before the linkage is cleared.
 */
export async function convergeDriversAfterRunEnd(
  db: DriverRunStateDb,
  tripId: string,
): Promise<string[]> {
  const stranded = await db.driverProfile.findMany({
    where: { currentTripId: tripId },
    select: { id: true },
  });
  if (stranded.length === 0) return [];

  const driverIds = stranded.map((d: { id: string }) => d.id);

  const openShifts = await db.driverShift.findMany({
    where: { driverProfileId: { in: driverIds }, endedAt: null },
    select: { driverProfileId: true },
  });
  const onDutyIds = new Set<string>(
    openShifts.map((s: { driverProfileId: string }) => s.driverProfileId),
  );
  const offDutyIds = driverIds.filter((id: string) => !onDutyIds.has(id));

  if (onDutyIds.size > 0) {
    await db.driverProfile.updateMany({
      where: { id: { in: [...onDutyIds] }, currentTripId: tripId },
      data: {
        status: "AVAILABLE",
        currentTripId: null,
        totalTripsCompleted: { increment: 1 },
      },
    });
    await db.driverShift.updateMany({
      where: { driverProfileId: { in: [...onDutyIds] }, endedAt: null },
      data: { tripsCompleted: { increment: 1 } },
    });
  }

  if (offDutyIds.length > 0) {
    await db.driverProfile.updateMany({
      where: { id: { in: offDutyIds }, currentTripId: tripId },
      data: {
        status: "OFFLINE",
        currentTripId: null,
        totalTripsCompleted: { increment: 1 },
      },
    });
  }

  return driverIds;
}

/**
 * Operational teardown when a driver loses driving privileges while a run may
 * still be open (verification SUSPENDED or REJECTED): closes any open shift
 * (so earnings stop accruing), clears currentTripId and parks the profile at
 * `finalStatus`. Callers remain responsible for writing verification fields.
 */
export async function suspendDriverOperationalState(
  db: DriverRunStateDb,
  driverProfileId: string,
  finalStatus: PostRunStatus | "SUSPENDED",
): Promise<void> {
  const now = new Date();

  const openShift = await db.driverShift.findFirst({
    where: { driverProfileId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });

  if (openShift) {
    await db.driverShift.update({
      where: { id: openShift.id },
      data: {
        endedAt: now,
        totalMinutes: Math.max(
          0,
          Math.round((now.getTime() - openShift.startedAt.getTime()) / 60000),
        ),
      },
    });
  }

  await db.driverProfile.update({
    where: { id: driverProfileId },
    data: { status: finalStatus, currentTripId: null },
  });
}
