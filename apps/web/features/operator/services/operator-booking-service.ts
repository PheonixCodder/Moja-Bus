import type { Prisma, PrismaClient } from "@moja/db";
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
import {
  endOfAppCalendarDay,
  startOfAppCalendarDay,
} from "@/lib/timezone";

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

function departureRangeForFilter(
  filter: OperatorBookingFilter,
): Prisma.DateTimeFilter {
  const now = new Date();
  const todayStart = startOfAppCalendarDay(now);
  const todayEnd = endOfAppCalendarDay(now);

  if (filter === "today") {
    return { gte: todayStart, lte: todayEnd };
  }
  if (filter === "upcoming") {
    return { gt: todayEnd };
  }
  return { lt: todayStart };
}

export class OperatorBookingService {
  constructor(private prisma: PrismaClient) {}

  async listCompanyBookings(
    companyId: string,
    input: ListInput,
  ): Promise<OperatorBookingsListResult> {
    const search = input.search?.trim();
    const departureFilter = departureRangeForFilter(input.filter);

    const departureClause: Prisma.BookingWhereInput = {
      OR: [
        { originTripStop: { scheduledDeparture: departureFilter } },
        {
          AND: [
            { originTripStop: { scheduledDeparture: null } },
            { trip: { departureDate: departureFilter } },
          ],
        },
      ],
    };

    const where: Prisma.BookingWhereInput = {
      companyId,
      ...(input.tripId ? { tripId: input.tripId } : {}),
      ...(input.status ? { status: input.status } : {}),
      AND: [
        departureClause,
        ...(search
          ? [
              {
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
              } satisfies Prisma.BookingWhereInput,
            ]
          : []),
      ],
    };

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: bookingInclude,
        orderBy: [{ trip: { departureDate: "asc" } }, { createdAt: "asc" }],
        skip: input.offset,
        take: input.limit,
      }),
    ]);

    return {
      items: bookings.map((booking) => {
        const departureTime =
          booking.originTripStop.scheduledDeparture ??
          booking.trip.departureDate;
        return this.toListItem(booking, departureTime);
      }),
      total,
    };
  }

  async getCompanyBooking(
    companyId: string,
    bookingId: string,
  ): Promise<OperatorBookingDetail & { userId: string | null }> {
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

    return {
      ...this.toDetail(booking),
      userId: booking.userId,
    };
  }

  async checkIn(
    companyId: string,
    input: CheckInInput,
  ): Promise<OperatorCheckInResult> {
    let bookingId = input.bookingId;

    if (!bookingId && input.ticketToken) {
      const token = parseTicketToken(input.ticketToken);
      // Company-scoped lookup first — avoid cross-tenant existence oracle
      let byToken = await this.prisma.booking.findFirst({
        where: { ticketToken: token, companyId },
        select: { id: true },
      });

      if (!byToken) {
        byToken = await this.prisma.booking.findFirst({
          where: {
            companyId,
            bookingReference: {
              equals: token,
              mode: "insensitive" as const,
            },
          },
          select: { id: true },
        });
      }

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
      where: { id: bookingId, companyId },
      include: {
        seat: { select: { label: true } },
        trip: { select: { id: true, status: true } },
      },
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Booking not found.",
      });
    }

    if (input.tripId && booking.tripId !== input.tripId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This ticket is not valid for this trip.",
      });
    }

    const allowedTripStatuses = new Set(["BOARDING", "DELAYED", "DEPARTED"]);
    if (!allowedTripStatuses.has(booking.trip.status)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Check-in is only allowed when the trip is boarding (current: ${booking.trip.status}).`,
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
    const claimed = await this.prisma.booking.updateMany({
      where: { id: booking.id, checkedInAt: null, status: "CONFIRMED" },
      data: { checkedInAt, boardedAt: checkedInAt },
    });

    if (claimed.count === 0) {
      const current = await this.prisma.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: { seat: { select: { label: true } } },
      });
      return {
        success: true,
        alreadyCheckedIn: true,
        bookingId: current.id,
        bookingReference: current.bookingReference,
        passengerName: current.passengerName,
        seatLabel: current.seat.label,
        checkedInAt: current.checkedInAt ?? checkedInAt,
      };
    }

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
    const departureTime =
      booking.originTripStop.scheduledDeparture ?? booking.trip.departureDate;
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
