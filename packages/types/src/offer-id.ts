export interface ParsedOfferId {
  tripId: string;
  originTripStopId: string;
  destinationTripStopId: string;
}

/** Format: `${tripId}_${originTripStopId}_${destinationTripStopId}` */
export function buildOfferId(
  tripId: string,
  originTripStopId: string,
  destinationTripStopId: string,
): string {
  return `${tripId}_${originTripStopId}_${destinationTripStopId}`;
}

export function parseOfferId(offerId: string): ParsedOfferId {
  const parts = offerId.split("_");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error("Invalid offer ID format");
  }
  return {
    tripId: parts[0],
    originTripStopId: parts[1],
    destinationTripStopId: parts[2],
  };
}
