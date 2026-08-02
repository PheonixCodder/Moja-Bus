export type AvailabilityStatus = "AVAILABLE" | "FEW_LEFT" | "SOLD_OUT";

export function computeAvailabilityStatus(
  remaining: number,
  passengerCount: number,
): AvailabilityStatus {
  if (remaining === 0 || remaining < passengerCount) return "SOLD_OUT";
  if (remaining <= 5) return "FEW_LEFT";
  return "AVAILABLE";
}
