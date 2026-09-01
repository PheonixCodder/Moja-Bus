import { canOperateRuns } from "@moja/schemas";

/**
 * Phase 2E (DRV-P1-08) — Security allowlists for unverified drivers (PENDING / REJECTED / EXPIRED).
 *
 * Unverified idle drivers are strictly restricted to self-service, onboarding, and offer negotiations.
 * In-flight operational mutations are only permitted when the driver is actively operating a run
 * (currentTripId !== null), satisfying the Phase 06 never-strand safety invariant.
 */
export const UNVERIFIED_IDLE_ALLOWED_MUTATIONS = new Set([
  "setServicePreference",
  "respondToOffer",
  "respondToCounterOffer",
  "markMyOffersSeen",
  "acknowledgeUrgentDispatch",
  "presignLicenseDoc",
  "updateMyStatus",
]);

export const IN_FLIGHT_ALLOWED_MUTATIONS = new Set([
  "completeTrip",
  "reportTripDelay",
  "reportVehicleBreakdown",
  "logRestBreak",
  "resumeDuty",
  "recordStopArrival",
  "recordStopDeparture",
  "handoverTripControl",
  "checkInPassenger",
  "manualCheckInPassenger",
  "batchSyncCheckIns",
]);

export function canDriverInvokeMutation(
  verificationStatus: string,
  currentTripId: string | null | undefined,
  procedureName: string,
): boolean {
  if (canOperateRuns(verificationStatus as any)) return true;
  const isMidRun = Boolean(currentTripId);
  if (isMidRun && IN_FLIGHT_ALLOWED_MUTATIONS.has(procedureName)) return true;
  return UNVERIFIED_IDLE_ALLOWED_MUTATIONS.has(procedureName);
}
