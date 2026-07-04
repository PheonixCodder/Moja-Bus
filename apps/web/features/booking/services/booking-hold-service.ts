import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type { BookingHoldResult, ConfirmedBookingResult } from "@moja/types";
import { generateBookingReference } from "../lib/booking-reference";
import { isActiveBookingStatus, segmentsOverlap } from "../lib/segment-overlap";
import { SeatAvailabilityService } from "./seat-availability-service";
import { TripDetailsService } from "./trip-details-service";

const HOLD_DURATION_MS = 10 * 60 * 1000;

export class BookingHoldService {
  constructor(
    private prisma: PrismaClient,
    private tripDetailsService = new TripDetailsService(prisma),
    private seatAvailabilityService = new SeatAvailabilityService(prisma),
  ) {}

  async createHold(input: {
    offerId: string;
    seatIds: string[];
    passengerName: string;
    passengerPhone: string;
    userId?: string | null;
  }): Promise<BookingHoldResult> {
    const details = await this.tripDetailsService.getTripDetails(input.offerId);

    if (details.availability.status === "SOLD_OUT") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This trip segment is sold out",
      });
    }

    const availability = await this.seatAvailabilityService.getSeatAvailability(
      input.offerId,
    );

    const uniqueSeatIds = [...new Set(input.seatIds)];
    if (uniqueSeatIds.length !== input.seatIds.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Duplicate seats selected",
      });
    }

    for (const seatId of uniqueSeatIds) {
      const seat = availability.seats.find((s) => s.seatId === seatId);
      if (!seat) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid seat selection",
        });
      }
      if (seat.status !== "AVAILABLE") {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Seat ${seat.label} is no longer available`,
        });
      }
    }

    if (uniqueSeatIds.length > details.availability.remaining) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Not enough seats remaining for this segment",
      });
    }

    const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS);

    const result = await this.prisma.$transaction(async (tx) => {
      const overlappingBookings = await tx.booking.findMany({
        where: {
          tripId: details.tripId,
          seatId: { in: uniqueSeatIds },
          OR: [
            { status: "CONFIRMED" },
            {
              status: "PENDING_PAYMENT",
              holdExpiresAt: { gt: new Date() },
            },
          ],
        },
        select: {
          seatId: true,
          boardingStopOrder: true,
          dropoffStopOrder: true,
          status: true,
          holdExpiresAt: true,
        },
      });

      for (const seatId of uniqueSeatIds) {
        const conflict = overlappingBookings.find(
          (b) =>
            b.seatId === seatId &&
            segmentsOverlap(
              b.boardingStopOrder,
              b.dropoffStopOrder,
              details.boardingStopOrder,
              details.dropoffStopOrder,
            ) &&
            isActiveBookingStatus(b.status, b.holdExpiresAt),
        );
        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "One or more seats were just booked. Please try again.",
          });
        }
      }

      const bookingReferences: string[] = [];
      const createdIds: string[] = [];

      for (const seatId of uniqueSeatIds) {
        let reference = generateBookingReference();
        while (bookingReferences.includes(reference)) {
          reference = generateBookingReference();
        }
        bookingReferences.push(reference);

        const booking = await tx.booking.create({
          data: {
            companyId: details.companyId,
            tripId: details.tripId,
            userId: input.userId ?? null,
            seatId,
            originTripStopId: details.originTripStopId,
            destinationTripStopId: details.destinationTripStopId,
            boardingStopOrder: details.boardingStopOrder,
            dropoffStopOrder: details.dropoffStopOrder,
            status: "PENDING_PAYMENT",
            holdExpiresAt,
            farePaid: details.priceXOF,
            paymentStatus: "UNPAID",
            bookingReference: reference,
            passengerName: input.passengerName,
            passengerPhone: input.passengerPhone,
          },
        });
        createdIds.push(booking.id);
      }

      return { holdId: createdIds[0]!, bookingReferences, holdExpiresAt };
    });

    return {
      holdId: result.holdId,
      holdExpiresAt: result.holdExpiresAt,
      bookingReferences: result.bookingReferences,
      totalAmountXOF: details.priceXOF * uniqueSeatIds.length,
    };
  }

  async confirmBooking(
    holdId: string,
    userId?: string | null,
  ): Promise<ConfirmedBookingResult> {
    const anchor = await this.prisma.booking.findUnique({
      where: { id: holdId },
    });

    if (!anchor) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hold not found" });
    }

    if (anchor.status !== "PENDING_PAYMENT") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This hold has already been processed or expired",
      });
    }

    if (anchor.holdExpiresAt && anchor.holdExpiresAt < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This hold has expired. Please select seats again.",
      });
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        tripId: anchor.tripId,
        status: "PENDING_PAYMENT",
        holdExpiresAt: anchor.holdExpiresAt,
        passengerPhone: anchor.passengerPhone,
      },
    });

    const confirmed = await this.prisma.$transaction(async (tx) => {
      const updated = [];
      for (const b of bookings) {
        updated.push(
          await tx.booking.update({
            where: { id: b.id },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAID",
              issuedAt: new Date(),
              holdExpiresAt: null,
              ...(userId ? { userId } : {}),
            },
          }),
        );
      }
      return updated;
    });

    const totalAmountXOF = confirmed.reduce((sum, b) => sum + b.farePaid, 0);

    return {
      holdId,
      bookingReferences: confirmed.map((b) => b.bookingReference),
      ticketTokens: confirmed.map((b) => b.ticketToken),
      totalAmountXOF,
      status: "CONFIRMED",
    };
  }

  async releaseHold(holdId: string): Promise<{ success: true }> {
    const anchor = await this.prisma.booking.findUnique({
      where: { id: holdId },
    });

    if (!anchor) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hold not found" });
    }

    await this.prisma.booking.updateMany({
      where: {
        tripId: anchor.tripId,
        status: "PENDING_PAYMENT",
        holdExpiresAt: anchor.holdExpiresAt,
        passengerPhone: anchor.passengerPhone,
      },
      data: { status: "EXPIRED", holdExpiresAt: null },
    });

    return { success: true };
  }
}
