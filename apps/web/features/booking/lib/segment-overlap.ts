/**
 * Returns true when a booking's segment overlaps the passenger's chosen segment.
 */
export function segmentsOverlap(
  bookingBoardingOrder: number,
  bookingDropoffOrder: number,
  segmentOriginOrder: number,
  segmentDestinationOrder: number,
): boolean {
  return (
    bookingBoardingOrder < segmentDestinationOrder &&
    bookingDropoffOrder > segmentOriginOrder
  );
}

export function isActiveBookingStatus(
  status: string,
  holdExpiresAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (status === "CONFIRMED") return true;
  if (status === "PENDING_PAYMENT" && holdExpiresAt && holdExpiresAt > now) {
    return true;
  }
  return false;
}
