import { parseAsInteger } from "nuqs/server";

export const MAX_PASSENGERS = 6;

export const bookingParamsSchema = {
  passengers: parseAsInteger.withDefault(1),
};

export function clampPassengerCount(count: number): number {
  return Math.min(MAX_PASSENGERS, Math.max(1, count));
}
