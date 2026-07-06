import type { Booking, Prisma } from "@moja/db";

type HoldAnchor = Pick<
  Booking,
  "holdGroupId" | "tripId" | "holdExpiresAt" | "passengerPhone" | "status"
>;

/** Resolve all bookings in the same checkout hold (new holdGroupId or legacy phone grouping). */
export function holdGroupWhere(
  anchor: HoldAnchor,
  status?: Booking["status"],
): Prisma.BookingWhereInput {
  const statusFilter = status ? { status } : {};

  if (anchor.holdGroupId) {
    return {
      holdGroupId: anchor.holdGroupId,
      ...statusFilter,
    };
  }

  return {
    tripId: anchor.tripId,
    holdExpiresAt: anchor.holdExpiresAt,
    passengerPhone: anchor.passengerPhone,
    ...statusFilter,
  };
}

/** Group key for passenger booking list summaries. */
export function bookingSummaryGroupKey(booking: {
  holdGroupId: string | null;
  tripId: string;
  passengerPhone: string;
  holdExpiresAt: Date | null;
  issuedAt: Date | null;
  createdAt?: Date;
}): string {
  if (booking.holdGroupId) {
    return booking.holdGroupId;
  }

  const anchor =
    booking.holdExpiresAt ??
    booking.issuedAt ??
    booking.createdAt ??
    new Date(0);
  return `${booking.tripId}:${booking.passengerPhone}:${anchor.toISOString()}`;
}
