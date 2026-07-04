import { isActiveBookingStatus, segmentsOverlap } from "./segment-overlap";

export interface TripStopLike {
  stopOrder: number;
  terminal?: {
    name?: string;
    cityRelation?: { name?: string } | null;
  } | null;
}

export interface TripSegment {
  originOrder: number;
  destinationOrder: number;
  originLabel: string;
  destinationLabel: string;
}

export interface BookingSegmentLike {
  seatId: string;
  boardingStopOrder: number;
  dropoffStopOrder: number;
  status: string;
  holdExpiresAt?: Date | null;
}

export type SegmentSeatStatus = "available" | "booked" | "held" | "blocked";

function stopLabel(stop: TripStopLike): string {
  return (
    stop.terminal?.cityRelation?.name ??
    stop.terminal?.name ??
    `Stop ${stop.stopOrder}`
  );
}

export function buildConsecutiveSegments(
  tripStops: TripStopLike[],
): TripSegment[] {
  const sorted = [...tripStops].sort((a, b) => a.stopOrder - b.stopOrder);
  const segments: TripSegment[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const origin = sorted[i]!;
    const destination = sorted[i + 1]!;
    segments.push({
      originOrder: origin.stopOrder,
      destinationOrder: destination.stopOrder,
      originLabel: stopLabel(origin),
      destinationLabel: stopLabel(destination),
    });
  }

  return segments;
}

export function getActiveBookings<T extends BookingSegmentLike>(
  bookings: T[],
  now: Date = new Date(),
): T[] {
  return bookings.filter((b) =>
    isActiveBookingStatus(b.status, b.holdExpiresAt ?? null, now),
  );
}

export function getBookingsForSegment<T extends BookingSegmentLike>(
  bookings: T[],
  segment: Pick<TripSegment, "originOrder" | "destinationOrder">,
  now: Date = new Date(),
): T[] {
  return getActiveBookings(bookings, now).filter((b) =>
    segmentsOverlap(
      b.boardingStopOrder,
      b.dropoffStopOrder,
      segment.originOrder,
      segment.destinationOrder,
    ),
  );
}

export function countSegmentOccupancy(
  bookings: BookingSegmentLike[],
  segment: Pick<TripSegment, "originOrder" | "destinationOrder">,
  now: Date = new Date(),
): { occupied: number; confirmed: number; held: number } {
  const overlapping = getBookingsForSegment(bookings, segment, now);
  let confirmed = 0;
  let held = 0;

  for (const booking of overlapping) {
    if (booking.status === "CONFIRMED") {
      confirmed++;
    } else if (booking.status === "PENDING_PAYMENT") {
      held++;
    }
  }

  return {
    occupied: overlapping.length,
    confirmed,
    held,
  };
}

export function getSegmentSeatStatus(
  seatId: string,
  bookings: BookingSegmentLike[],
  segment: Pick<TripSegment, "originOrder" | "destinationOrder">,
  isBlocked: boolean,
  now: Date = new Date(),
): SegmentSeatStatus {
  if (isBlocked) return "blocked";

  const overlapping = getBookingsForSegment(bookings, segment, now).filter(
    (b) => b.seatId === seatId,
  );

  if (overlapping.length === 0) return "available";

  const hasConfirmed = overlapping.some((b) => b.status === "CONFIRMED");
  return hasConfirmed ? "booked" : "held";
}
