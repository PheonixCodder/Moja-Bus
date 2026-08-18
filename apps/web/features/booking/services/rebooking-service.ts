import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { generateBookingReference } from "../lib/booking-reference";

export type RebookPassengerInput = {
  prisma: PrismaClient;
  companyId: string;
  staffId?: string | undefined;
  bookingReference: string;
  targetTripId: string;
  targetSeatId?: string | undefined;
  reason: string;
};

export type RebookPassengerResult = {
  previousBookingReference: string;
  newBookingReference: string;
  newBookingId: string;
  targetTripId: string;
  seatNumber: string;
  departureDate: Date;
  passengerName: string;
  passengerPhone: string;
};

/**
 * Executes an atomic passenger rebooking by an operator staff member.
 * Cancels the original confirmed booking and mints a new live booking & ticket
 * on the target trip for the same operator and schedule.
 */
export async function rebookPassenger(
  input: RebookPassengerInput,
): Promise<RebookPassengerResult> {
  const { prisma, companyId, staffId, bookingReference, targetTripId, targetSeatId, reason } = input;

  if (!reason || reason.trim().length < 3) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A valid rebooking reason is required (minimum 3 characters)",
    });
  }

  // 1. Fetch and validate source booking
  const sourceBooking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: {
      trip: {
        include: {
          schedule: true,
        },
      },
      seat: true,
    },
  });

  if (!sourceBooking) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Booking with reference ${bookingReference} not found`,
    });
  }

  if (sourceBooking.companyId !== companyId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only rebook passengers on trips operated by your company",
    });
  }

  if (sourceBooking.status !== "CONFIRMED") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Cannot rebook booking in status ${sourceBooking.status} (must be CONFIRMED)`,
    });
  }

  if (sourceBooking.checkedInAt || sourceBooking.boardedAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot rebook a passenger who has already checked in or boarded",
    });
  }

  if (sourceBooking.tripId === targetTripId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Target trip must be different from the current trip",
    });
  }

  // 2. Fetch and validate target trip
  const targetTrip = await prisma.trip.findUnique({
    where: { id: targetTripId },
    include: {
      bus: {
        include: {
          seats: true,
        },
      },
      schedule: true,
      tripStops: {
        orderBy: { stopOrder: "asc" },
      },
      bookings: {
        where: {
          status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
        },
        select: {
          seatId: true,
          status: true,
          holdExpiresAt: true,
        },
      },
    },
  });

  if (!targetTrip) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Target trip not found",
    });
  }

  if (targetTrip.companyId !== companyId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Target trip belongs to a different operating company",
    });
  }

  if (targetTrip.status === "CANCELLED" || targetTrip.status === "ARRIVED") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Target trip is ${targetTrip.status.toLowerCase()} and cannot accept rebookings`,
    });
  }

  if (targetTrip.departureDate.getTime() <= Date.now()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Target trip has already departed",
    });
  }

  // 3. Resolve Origin and Destination stops on target trip
  const originTripStop =
    targetTrip.tripStops.find(
      (ts: { id: string; stopOrder: number }) =>
        ts.id === sourceBooking.originTripStopId || ts.stopOrder === sourceBooking.boardingStopOrder,
    ) ?? targetTrip.tripStops[0];

  const destinationTripStop =
    targetTrip.tripStops.find(
      (ts: { id: string; stopOrder: number }) =>
        ts.id === sourceBooking.destinationTripStopId || ts.stopOrder === sourceBooking.dropoffStopOrder,
    ) ?? targetTrip.tripStops[targetTrip.tripStops.length - 1];

  if (!originTripStop || !destinationTripStop) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Could not resolve origin/destination stops for the target trip",
    });
  }

  // 4. Resolve and validate Seat on target trip
  const allBusSeats = targetTrip.bus.seats.filter((s: { isBookable: boolean; isActive: boolean }) => s.isBookable && s.isActive);
  const now = new Date();

  const occupiedSeatIds = new Set(
    targetTrip.bookings
      .filter((b: { status: string; holdExpiresAt: Date | null }) => {
        if (b.status === "CONFIRMED") return true;
        if (b.status === "PENDING_PAYMENT" && b.holdExpiresAt && b.holdExpiresAt > now) return true;
        return false;
      })
      .map((b: { seatId: string }) => b.seatId),
  );

  let chosenSeat = targetSeatId
    ? allBusSeats.find((s: { id: string }) => s.id === targetSeatId)
    : undefined;

  if (chosenSeat && occupiedSeatIds.has(chosenSeat.id)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Selected seat #${chosenSeat.label} is already occupied on the target trip`,
    });
  }

  if (!chosenSeat) {
    // Auto-assign first available seat
    chosenSeat = allBusSeats.find((s: { id: string }) => !occupiedSeatIds.has(s.id));
    if (!chosenSeat) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No available seats on the selected target trip",
      });
    }
  }

  // 5. Execute Atomic Rebooking in Transaction
  const rebookingResult = await prisma.$transaction(async (tx) => {
    // Generate new unique booking reference
    let newRef = generateBookingReference();
    const existing = await tx.booking.findUnique({ where: { bookingReference: newRef } });
    if (existing) {
      newRef = generateBookingReference();
    }

    const rebookTimestamp = new Date();

    // Create the new active booking
    const newBooking = await tx.booking.create({
      data: {
        companyId,
        tripId: targetTrip.id,
        userId: sourceBooking.userId,
        seatId: chosenSeat!.id,
        originTripStopId: originTripStop.id,
        destinationTripStopId: destinationTripStop.id,
        boardingStopOrder: originTripStop.stopOrder,
        dropoffStopOrder: destinationTripStop.stopOrder,
        status: "CONFIRMED",
        issuedAt: rebookTimestamp,
        farePaid: sourceBooking.farePaid,
        paymentStatus: "PAID",
        bookingReference: newRef,
        passengerName: sourceBooking.passengerName,
        passengerPhone: sourceBooking.passengerPhone,
        holdGroupId: sourceBooking.holdGroupId,
        savedPassengerId: sourceBooking.savedPassengerId,
        rebookedFromBookingId: sourceBooking.id,
        rebookReason: reason.trim(),
        rebookedAt: rebookTimestamp,
        rebookedByStaffId: staffId ?? null,
      },
    });

    // Mark original booking as cancelled with rebooking metadata
    await tx.booking.update({
      where: { id: sourceBooking.id },
      data: {
        status: "CANCELLED",
        rebookReason: `REBOOKED_TO_${newRef}: ${reason.trim()}`,
        rebookedAt: rebookTimestamp,
        rebookedByStaffId: staffId ?? null,
      },
    });

    return {
      newBooking,
      chosenSeat: chosenSeat!,
    };
  });

  // 6. Asynchronous Notification dispatch (SMS / Novu)
  try {
    const { notifyRebookingSuccess } = await import("./rebooking-notifier");
    await notifyRebookingSuccess({
      passengerName: sourceBooking.passengerName,
      passengerPhone: sourceBooking.passengerPhone,
      oldBookingReference: sourceBooking.bookingReference,
      newBookingReference: rebookingResult.newBooking.bookingReference,
      companyName: sourceBooking.trip.schedule?.name ?? "Moja Ride",
      departureTime: targetTrip.departureDate,
      seatNumber: Number(rebookingResult.chosenSeat.label) || 1,
    });
  } catch (err) {
    console.error("[RebookingNotifier] Failed to send rebooking notification:", err);
  }

  return {
    previousBookingReference: sourceBooking.bookingReference,
    newBookingReference: rebookingResult.newBooking.bookingReference,
    newBookingId: rebookingResult.newBooking.id,
    targetTripId: targetTrip.id,
    seatNumber: rebookingResult.chosenSeat.label,
    departureDate: targetTrip.departureDate,
    passengerName: sourceBooking.passengerName,
    passengerPhone: sourceBooking.passengerPhone,
  };
}

/**
 * Lists upcoming candidate departures for the same schedule / route with open seats.
 */
export async function listUpcomingScheduleTrips(params: {
  prisma: PrismaClient;
  companyId: string;
  scheduleId?: string | undefined;
  routeId?: string | undefined;
  limit?: number | undefined;
}) {
  const { prisma, companyId, scheduleId, routeId, limit = 20 } = params;
  const now = new Date();

  const trips = await prisma.trip.findMany({
    where: {
      companyId,
      status: { in: ["SCHEDULED", "BOARDING"] },
      departureDate: { gt: now },
      archivedAt: null,
      ...(scheduleId ? { scheduleId } : {}),
      ...(routeId ? { schedule: { routeId } } : {}),
    },
    include: {
      schedule: {
        include: {
          route: {
            include: {
              originTerminal: { include: { cityRelation: true } },
              destTerminal: { include: { cityRelation: true } },
            },
          },
        },
      },
      bus: {
        include: {
          seats: true,
          layoutTemplate: true,
        },
      },
      bookings: {
        where: {
          status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
        },
        select: {
          seatId: true,
          status: true,
          holdExpiresAt: true,
        },
      },
    },
    orderBy: { departureDate: "asc" },
    take: limit,
  });

  return trips.map((trip) => {
    const allSeats = trip.bus?.seats ?? [];
    const seats = allSeats.filter((s) => s.isBookable && s.isActive);
    const totalSeats = trip.totalSeats ?? seats.length;
    const occupiedSeats = trip.bookings.filter((b: { status: string; holdExpiresAt: Date | null }) => {
      if (b.status === "CONFIRMED") return true;
      if (b.status === "PENDING_PAYMENT" && b.holdExpiresAt && b.holdExpiresAt > now) return true;
      return false;
    }).length;

    const availableSeats = Math.max(0, totalSeats - occupiedSeats);

    // Derive rows/cols from layout template or seats
    const maxRow = allSeats.reduce((max, s) => Math.max(max, s.row), 1);
    const maxCol = allSeats.reduce((max, s) => Math.max(max, s.col), 1);
    const rows = trip.bus?.layoutTemplate?.rows ?? maxRow;
    const columns = trip.bus?.layoutTemplate?.columns ?? maxCol;

    return {
      id: trip.id,
      scheduleId: trip.scheduleId,
      scheduleName: trip.schedule?.name ?? "Schedule",
      routeName: trip.schedule?.route?.name ?? "Route",
      originCity: trip.schedule?.route?.originTerminal?.cityRelation?.name ?? trip.schedule?.route?.originTerminal?.name ?? "Origin",
      destinationCity: trip.schedule?.route?.destTerminal?.cityRelation?.name ?? trip.schedule?.route?.destTerminal?.name ?? "Destination",
      departureDate: trip.departureDate,
      busName: trip.bus?.internalName ?? trip.bus?.registrationPlate ?? "Bus",
      plateNumber: trip.bus?.registrationPlate ?? "",
      totalSeats,
      availableSeats,
      rows,
      columns,
      seats: allSeats.map((s) => {
        const isOccupied = trip.bookings.some(
          (b: { seatId: string; status: string; holdExpiresAt: Date | null }) =>
            b.seatId === s.id &&
            (b.status === "CONFIRMED" ||
              (b.status === "PENDING_PAYMENT" && b.holdExpiresAt && b.holdExpiresAt > now)),
        );
        return {
          id: s.id,
          seatId: s.id,
          seatNumber: s.label,
          label: s.label,
          row: s.row,
          col: s.col,
          deck: s.deck ?? 1,
          seatType: s.seatType,
          isBookable: s.isBookable,
          isActive: s.isActive,
          isOccupied,
          status: !s.isBookable || !s.isActive
            ? "BLOCKED"
            : isOccupied
              ? "SOLD"
              : ("AVAILABLE" as const),
        };
      }),
    };
  });
}
