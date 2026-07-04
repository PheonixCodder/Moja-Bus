import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type {
  OperatorBookingDetail,
  OperatorBookingFilter,
  OperatorBookingListItem,
  OperatorBookingsListResult,
  OperatorCheckInResult,
  PassengerBookingStatus,
} from "@moja/types";
import { parseTicketToken } from "@/features/operator/lib/parse-ticket-token";

export { parseTicketToken };

type ListInput = {
  filter: OperatorBookingFilter;
  tripId?: string | undefined;
  status?: PassengerBookingStatus | undefined;
  search?: string | undefined;
  limit: number;
  offset: number;
};

type CheckInInput = {
  bookingId?: string | undefined;
  ticketToken?: string | undefined;
  tripId?: string | undefined;
};

const bookingInclude = {
  seat: { select: { label: true } },
  trip: {
    select: {
      id: true,
      departureDate: true,
    },
  },
  originTripStop: {
    include: {
      terminal: { include: { cityRelation: true } },
    },
  },
  destinationTripStop: {
    include: {
      terminal: { include: { cityRelation: true } },
    },
  },
} as const;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function endOfToday(): Date {
  const start = startOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function getDepartureTime(booking: {
  originTripStop: { scheduledDeparture: Date | null };
  trip: { departureDate: Date };
}): Date {
  return booking.originTripStop.scheduledDeparture ?? booking.trip.departureDate;
}

function matchesFilter(
  departureTime: Date,
  filter: OperatorBookingFilter,
  now: Date,
): boolean {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  if (filter === "today") {
    return (
      departureTime.getTime() >= todayStart.getTime() &&
      departureTime.getTime() <= todayEnd.getTime()
    );
  }
  if (filter === "upcoming") {
    return departureTime.getTime() > todayEnd.getTime();
  }
  return departureTime.getTime() < todayStart.getTime();
}

export class OperatorBookingService {
  constructor(private prisma: PrismaClient) {}

  async listCompanyBookings(
    companyId: string,
    input: ListInput,
  ): Promise<OperatorBookingsListResult> {
    const now = new Date();
    const search = input.search?.trim();

    const bookings = await this.prisma.booking.findMany({
      where: {
        companyId,
        ...(input.tripId ? { tripId: input.tripId } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(search
          ? {
              OR: [
                {
                  bookingReference: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  passengerName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                { passengerPhone: { contains: search } },
              ],
            }
          : {}),
      },
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
    });

    const filtered = bookings
      .map((booking) => ({
        booking,
        departureTime: getDepartureTime(booking),
      }))
      .filter(({ departureTime }) =>
        matchesFilter(departureTime, input.filter, now),
      )
      .sort(
        (a, b) => a.departureTime.getTime() - b.departureTime.getTime(),
      );

    const total = filtered.length;
    const page = filtered.slice(input.offset, input.offset + input.limit);

    return {
      items: page.map(({ booking, departureTime }) =>
        this.toListItem(booking, departureTime),
      ),
      total,
    };
  }

  async getCompanyBooking(
    companyId: string,
    bookingId: string,
  ): Promise<OperatorBookingDetail> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, companyId },
      include: bookingInclude,
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Booking not found.",
      });
    }

    return this.toDetail(booking);
  }

  async checkIn(
    companyId: string,
    input: CheckInInput,
  ): Promise<OperatorCheckInResult> {
    let bookingId = input.bookingId;

    if (!bookingId && input.ticketToken) {
      const token = parseTicketToken(input.ticketToken);
      const byToken = await this.prisma.booking.findUnique({
        where: { ticketToken: token },
        select: { id: true },
      });
      if (!byToken) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or unknown ticket.",
        });
      }
      bookingId = byToken.id;
    }

    if (!bookingId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "bookingId or ticketToken is required.",
      });
    }

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId },
      include: { seat: { select: { label: true } } },
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Booking not found.",
      });
    }

    if (booking.companyId !== companyId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This ticket belongs to another operator.",
      });
    }

    if (input.tripId && booking.tripId !== input.tripId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This ticket is not valid for this trip.",
      });
    }

    if (booking.status !== "CONFIRMED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot check in a booking with status ${booking.status}.`,
      });
    }

    if (booking.checkedInAt) {
      return {
        success: true,
        alreadyCheckedIn: true,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        passengerName: booking.passengerName,
        seatLabel: booking.seat.label,
        checkedInAt: booking.checkedInAt,
      };
    }

    const checkedInAt = new Date();
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { checkedInAt },
    });

    return {
      success: true,
      alreadyCheckedIn: false,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      passengerName: booking.passengerName,
      seatLabel: booking.seat.label,
      checkedInAt,
    };
  }

  private toListItem(
    booking: {
      id: string;
      bookingReference: string;
      tripId: string;
      passengerName: string;
      passengerPhone: string;
      status: string;
      paymentStatus: string;
      checkedInAt: Date | null;
      seat: { label: string };
      originTripStop: {
        scheduledDeparture: Date | null;
        terminal: {
          name: string;
          cityRelation: { name: string } | null;
        };
      };
      destinationTripStop: {
        terminal: {
          name: string;
          cityRelation: { name: string } | null;
        };
      };
    },
    departureTime: Date,
  ): OperatorBookingListItem {
    return {
      id: booking.id,
      bookingReference: booking.bookingReference,
      tripId: booking.tripId,
      passengerName: booking.passengerName,
      passengerPhone: booking.passengerPhone,
      seatLabel: booking.seat.label,
      status: booking.status as PassengerBookingStatus,
      paymentStatus: booking.paymentStatus,
      checkedInAt: booking.checkedInAt,
      departureTime,
      originCityName:
        booking.originTripStop.terminal.cityRelation?.name ?? "Côte d'Ivoire",
      destinationCityName:
        booking.destinationTripStop.terminal.cityRelation?.name ??
        "Côte d'Ivoire",
      originTerminalName: booking.originTripStop.terminal.name,
      destinationTerminalName: booking.destinationTripStop.terminal.name,
    };
  }

  private toDetail(
    booking: {
      id: string;
      bookingReference: string;
      tripId: string;
      passengerName: string;
      passengerPhone: string;
      status: string;
      paymentStatus: string;
      checkedInAt: Date | null;
      ticketToken: string;
      farePaid: number;
      issuedAt: Date | null;
      boardingStopOrder: number;
      dropoffStopOrder: number;
      seat: { label: string };
      trip: { departureDate: Date };
      originTripStop: {
        scheduledDeparture: Date | null;
        terminal: {
          name: string;
          cityRelation: { name: string } | null;
        };
      };
      destinationTripStop: {
        terminal: {
          name: string;
          cityRelation: { name: string } | null;
        };
      };
    },
  ): OperatorBookingDetail {
    const departureTime = getDepartureTime(booking);
    return {
      ...this.toListItem(booking, departureTime),
      ticketToken: booking.ticketToken,
      farePaidXOF: booking.farePaid,
      issuedAt: booking.issuedAt,
      boardingStopOrder: booking.boardingStopOrder,
      dropoffStopOrder: booking.dropoffStopOrder,
    };
  }
}
