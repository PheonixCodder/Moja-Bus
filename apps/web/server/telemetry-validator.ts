import type { DriverLocationPingInput } from "@moja/schemas";
import { MAX_PING_ACCURACY_METERS } from "@/lib/driver-scoring";

const EARTH_RADIUS_KM = 6371;

export { MAX_PING_ACCURACY_METERS };

const MAX_SPEED_KMH = 200;
const MAX_JUMP_SPEED_KMH = 220; // Teleportation filter

/**
 * Calculates Great-Circle Haversine distance in meters between two GPS coordinates.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c * 1000;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  distanceMeters?: number;
  calculatedSpeedKmh?: number;
}

/**
 * Validates incoming driver GPS telemetry against physical constraints.
 * Inspired by Safarpay's high-precision vehicle tracking engine.
 *
 * Phase 28 (F-TM-07/F-TM-14 contract change): horizontal accuracy NO LONGER
 * hard-rejects. A fix with poor accuracy is still persisted — classified as
 * LOW_ACCURACY by derivePingAnomaly (@/lib/driver-scoring), unscored, and
 * excluded from last-position updates and from serving as a jump-gate
 * reference point. Urban-canyon stretches therefore keep their history
 * instead of vanishing, while garbage fixes can never score or poison the
 * teleport filter. This gate owns ONLY physically-impossible signals:
 * bounds, instantaneous speed, and implausible jumps.
 */
export function validateTelemetryPing(
  currentPing: DriverLocationPingInput,
  previousPing?: {
    latitude: number;
    longitude: number;
    timestamp: Date | string;
  } | null,
): ValidationResult {
  // Gate 1: Latitude & Longitude bounds
  if (
    currentPing.latitude < -90 ||
    currentPing.latitude > 90 ||
    currentPing.longitude < -180 ||
    currentPing.longitude > 180
  ) {
    return {
      isValid: false,
      reason: "GPS coordinates out of global geographical bounds",
    };
  }

  // Gate 2: Instantaneous Speed Filter
  if (currentPing.speedKmh > MAX_SPEED_KMH) {
    return {
      isValid: false,
      reason: `Speed ${currentPing.speedKmh.toFixed(1)} km/h exceeds maximum physical bus threshold (${MAX_SPEED_KMH} km/h)`,
    };
  }

  // Gate 3: Haversine Jump Velocity Gate (if previous ping exists)
  if (previousPing) {
    const prevTime = new Date(previousPing.timestamp).getTime();
    const currTime = new Date(currentPing.recordedAt).getTime();
    const elapsedSeconds = Math.max(1, (currTime - prevTime) / 1000);

    const distanceMeters = calculateHaversineDistanceMeters(
      previousPing.latitude,
      previousPing.longitude,
      currentPing.latitude,
      currentPing.longitude,
    );

    const calculatedSpeedKmh = (distanceMeters / elapsedSeconds) * 3.6;

    if (calculatedSpeedKmh > MAX_JUMP_SPEED_KMH) {
      return {
        isValid: false,
        reason: `Implausible GPS jump: traveled ${(distanceMeters / 1000).toFixed(2)}km in ${elapsedSeconds}s (${calculatedSpeedKmh.toFixed(1)} km/h)`,
        distanceMeters,
        calculatedSpeedKmh,
      };
    }

    return {
      isValid: true,
      distanceMeters,
      calculatedSpeedKmh,
    };
  }

  return { isValid: true };
}
