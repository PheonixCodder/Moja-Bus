import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type { PassengerSeatStatus, SeatAvailability } from "@moja/types";
import { isActiveBookingStatus, segmentsOverlap } from "../lib/segment-overlap";
import { TripDetailsService } from "./trip-details-service";

export class SeatAvailabilityService {
  constructor(
    private prisma: PrismaClient,
    private tripDetailsService = new TripDetailsService(prisma),
  ) {}

  async getSeatAvailability(offerId: string): Promise<SeatAvailability> {
    const details = await this.tripDetailsService.getTripDetails(offerId);

    const trip = await this.prisma.trip.findUnique({
      where: { id: details.tripId },
      include: {
        bus: { include: { layoutTemplate: true } },
        seats: {
          include: { seat: true },
          orderBy: [{ seat: { deck: "asc" } }, { seat: { row: "asc" } }, { seat: { col: "asc" } }],
        },
        bookings: {
          where: {
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
        },
      },
    });

    if (!trip) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
    }

    const layout = trip.bus.layoutTemplate;
    const now = new Date();

    const seats = trip.seats.map((tripSeat) => {
      const seat = tripSeat.seat;
      let status: PassengerSeatStatus = "AVAILABLE";

      if (
        seat.seatType === "DRIVER_AREA" ||
        seat.seatType === "EMPTY_SPACE"
      ) {
        status = seat.seatType === "DRIVER_AREA" ? "DRIVER" : "EMPTY";
      } else if (!tripSeat.isActive || !seat.isActive) {
        status = "BLOCKED";
      } else {
        const conflicting = trip.bookings.find(
          (b) =>
            b.seatId === seat.id &&
            segmentsOverlap(
              b.boardingStopOrder,
              b.dropoffStopOrder,
              details.boardingStopOrder,
              details.dropoffStopOrder,
            ) &&
            isActiveBookingStatus(b.status, b.holdExpiresAt, now),
        );

        if (conflicting) {
          status =
            conflicting.status === "PENDING_PAYMENT" ? "HELD" : "SOLD";
        }
      }

      return {
        seatId: seat.id,
        tripSeatId: tripSeat.id,
        label: seat.label,
        row: seat.row,
        col: seat.col,
        deck: seat.deck,
        seatType: seat.seatType,
        status,
      };
    });

    return {
      offerId,
      rows: layout.rows,
      columns: layout.columns,
      deck: 1,
      priceXOF: details.priceXOF,
      seats,
    };
  }
}
