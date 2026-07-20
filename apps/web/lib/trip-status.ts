import type { TripStatus } from "@moja/schemas";

const TRANSITIONS: Record<TripStatus, readonly TripStatus[]> = {
  SCHEDULED: ["BOARDING", "DELAYED"], // CANCELLED is a terminal state reachable only via trips.cancel
  BOARDING: ["DEPARTED", "DELAYED"],
  DELAYED: ["BOARDING", "DEPARTED", "DELAYED"],
  DEPARTED: ["ARRIVED"],
  ARRIVED: [],
  CANCELLED: [],
};

export function canTransitionTripStatus(
  from: TripStatus,
  to: TripStatus,
): boolean {
  if (from === to && from === "DELAYED") return true;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTripTransition(from: TripStatus, to: TripStatus): void {
  if (!canTransitionTripStatus(from, to)) {
    throw new Error(
      `Invalid trip status transition from ${from} to ${to}.`,
    );
  }
}

export function nextTripActions(status: TripStatus): {
  canBoard: boolean;
  canDepart: boolean;
  canArrive: boolean;
  canDelay: boolean;
  canCancel: boolean;
} {
  return {
    canBoard: canTransitionTripStatus(status, "BOARDING"),
    canDepart: canTransitionTripStatus(status, "DEPARTED"),
    canArrive: canTransitionTripStatus(status, "ARRIVED"),
    canDelay:
      canTransitionTripStatus(status, "DELAYED") || status === "DELAYED",
    canCancel: ["SCHEDULED", "BOARDING", "DELAYED"].includes(status),
  };
}
