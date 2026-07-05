import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type {
  DigitalTicketDTO,
  PassengerBookingSummary,
  PassengerBookingsListResult,
} from "@moja/types";
import { buildOfferId } from "@moja/types";
import { phonesMatch } from "@/features/booking/lib/normalize-phone";
import { bookingSummaryGroupKey } from "@/features/booking/lib/hold-group";

type BookingFilter = "upcoming" | "past" | "pending";

const bookingInclude = {
  seat: true,
  company: true,
  originTripStop: {
    include: { terminal: { include: { cityRelation: true } } },
  },
  destinationTripStop: {
    include: { terminal: { include: { cityRelation: true } } },
  },
} as const;

const LIST_STATUSES = [
  "CONFIRMED",
  "PENDING_PAYMENT",
  "CANCELLED",
  "EXPIRED",
  "COMPLETED",
] as const;

export class BookingReadService {
  constructor(private prisma: PrismaClient) {}

  private async getUserPhone(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    return user?.phone ?? null;
  }

  private canAccessBooking(
    booking: { userId: string | null; passengerPhone: string },
    userId: string,
    userPhone: string | null,
  ): boolean {
    if (booking.userId === userId) return true;
    if (!booking.userId && userPhone) {
      return phonesMatch(booking.passengerPhone, userPhone);
    }
    return false;
  }

  private async claimUnlinkedBookings(
    userId: string,
    bookingIds: string[],
  ): Promise<void> {
    if (bookingIds.length === 0) return;
    await this.prisma.booking.updateMany({
      where: { id: { in: bookingIds }, userId: null },
      data: { userId },
    });
  }

  private async loadAccessibleBookings(userId: string) {
    const userPhone = await this.getUserPhone(userId);

    const candidates = await this.prisma.booking.findMany({
      where: {
        status: { in: [...LIST_STATUSES] },
        OR: [{ userId }, ...(userPhone ? [{ userId: null }] : [])],
      },
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
    });

    const accessible = candidates.filter((b) =>
      this.canAccessBooking(b, userId, userPhone),
    );

    const unclaimedIds = accessible
      .filter((b) => b.userId === null)
      .map((b) => b.id);
    await this.claimUnlinkedBookings(userId, unclaimedIds);

    return accessible;
  }

  async listMyBookings(
    userId: string,
    filter: BookingFilter,
    limit: number,
    offset: number,
  ): Promise<PassengerBookingsListResult> {
    const now = new Date();

    const bookings = await this.loadAccessibleBookings(userId);

    const groups = new Map<string, typeof bookings>();
    for (const booking of bookings) {
      const key = bookingSummaryGroupKey(booking);
      const list = groups.get(key) ?? [];
      list.push(booking);
      groups.set(key, list);
    }

    let summaries = [...groups.values()].map((group) =>
      this.toSummary(group),
    );

    summaries = summaries.filter((item) => {
      if (filter === "pending") {
        return item.status === "PENDING_PAYMENT";
      }
      if (filter === "upcoming") {
        return (
          item.status === "CONFIRMED" && item.departureTime.getTime() >= now.getTime()
        );
      }
      // past
      return (
        item.status === "COMPLETED" ||
        item.status === "CANCELLED" ||
        item.status === "EXPIRED" ||
        (item.status === "CONFIRMED" && item.departureTime.getTime() < now.getTime())
      );
    });

    summaries.sort(
      (a, b) => b.departureTime.getTime() - a.departureTime.getTime(),
    );

    const total = summaries.length;
    const items = summaries.slice(offset, offset + limit);

    return { items, total };
  }

  async getBooking(
    userId: string,
    bookingReference: string,
  ): Promise<PassengerBookingSummary> {
    const userPhone = await this.getUserPhone(userId);

    const anchor = await this.prisma.booking.findFirst({
      where: { bookingReference },
      include: bookingInclude,
    });

    if (
      !anchor ||
      !this.canAccessBooking(anchor, userId, userPhone)
    ) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    if (!anchor.userId) {
      await this.claimUnlinkedBookings(userId, [anchor.id]);
    }

    const groupWhere = anchor.holdGroupId
      ? { holdGroupId: anchor.holdGroupId }
      : {
          tripId: anchor.tripId,
          holdExpiresAt: anchor.holdExpiresAt,
          issuedAt: anchor.issuedAt,
          passengerPhone: anchor.passengerPhone,
        };

    const group = await this.prisma.booking.findMany({
      where: {
        ...groupWhere,
        OR: [{ userId }, { userId: null }],
      },
      include: bookingInclude,
    });

    const accessibleGroup = group.filter((b) =>
      this.canAccessBooking(b, userId, userPhone),
    );

    if (accessibleGroup.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    await this.claimUnlinkedBookings(
      userId,
      accessibleGroup.filter((b) => !b.userId).map((b) => b.id),
    );

    return this.toSummary(accessibleGroup);
  }

  async getTicket(
    userId: string,
    input: { bookingReference?: string; ticketToken?: string },
  ): Promise<DigitalTicketDTO> {
    const userPhone = await this.getUserPhone(userId);

    const booking = input.bookingReference
      ? await this.prisma.booking.findFirst({
          where: { bookingReference: input.bookingReference },
          include: bookingInclude,
        })
      : await this.prisma.booking.findFirst({
          where: { ticketToken: input.ticketToken! },
          include: bookingInclude,
        });

    if (
      !booking ||
      !this.canAccessBooking(booking, userId, userPhone)
    ) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
    }

    if (!booking.userId) {
      await this.claimUnlinkedBookings(userId, [booking.id]);
    }

    if (booking.status !== "CONFIRMED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Ticket is not available for this booking status",
      });
    }

    return this.toDigitalTicket(booking);
  }

  async getTicketByToken(ticketToken: string): Promise<DigitalTicketDTO> {
    const booking = await this.prisma.booking.findUnique({
      where: { ticketToken },
      include: bookingInclude,
    });

    if (!booking || booking.status !== "CONFIRMED") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
    }

    return this.toDigitalTicket(booking);
  }

  async verifyTicketByToken(ticketToken: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { ticketToken },
      select: {
        bookingReference: true,
        status: true,
        passengerName: true,
        seat: { select: { label: true } },
        company: { select: { name: true } },
      },
    });

    if (!booking || booking.status !== "CONFIRMED") {
      return { valid: false as const };
    }

    return {
      valid: true as const,
      bookingReference: booking.bookingReference,
      passengerName: booking.passengerName,
      seatLabel: booking.seat.label,
      companyName: booking.company.name,
      status: booking.status,
    };
  }

  private toSummary(
    group: Array<{
      id: string;
      tripId: string;
      holdGroupId: string | null;
      createdAt: Date;
      bookingReference: string;
      ticketToken: string;
      status: string;
      paymentStatus: string;
      holdExpiresAt: Date | null;
      issuedAt: Date | null;
      farePaid: number;
      passengerName: string;
      passengerPhone: string;
      originTripStopId: string;
      destinationTripStopId: string;
      seat: { label: string };
      company: { name: string };
      originTripStop: {
        scheduledDeparture: Date | null;
        terminal: { name: string; cityRelation: { name: string } | null };
      };
      destinationTripStop: {
        scheduledArrival: Date | null;
        terminal: { name: string; cityRelation: { name: string } | null };
      };
    }>,
  ): PassengerBookingSummary {
    const first = group[0]!;
    const departureTime = first.originTripStop.scheduledDeparture ?? new Date();
    const arrivalTime =
      first.destinationTripStop.scheduledArrival ?? departureTime;

    const uniqueNames = [...new Set(group.map((b) => b.passengerName))];
    const displayName =
      uniqueNames.length === 1
        ? first.passengerName
        : `${first.passengerName} + ${uniqueNames.length - 1} other${uniqueNames.length > 2 ? "s" : ""}`;

    return {
      groupId: bookingSummaryGroupKey(first),
      tripId: first.tripId,
      companyName: first.company.name,
      originTerminalName: first.originTripStop.terminal.name,
      originCityName:
        first.originTripStop.terminal.cityRelation?.name ?? "Côte d'Ivoire",
      destinationTerminalName: first.destinationTripStop.terminal.name,
      destinationCityName:
        first.destinationTripStop.terminal.cityRelation?.name ??
        "Côte d'Ivoire",
      departureTime,
      arrivalTime,
      passengerName: displayName,
      passengerPhone: first.passengerPhone,
      status: first.status as PassengerBookingSummary["status"],
      paymentStatus: first.paymentStatus,
      holdExpiresAt: first.holdExpiresAt,
      issuedAt: first.issuedAt,
      totalAmountXOF: group.reduce((sum, b) => sum + b.farePaid, 0),
      seats: group.map((b) => ({
        bookingId: b.id,
        bookingReference: b.bookingReference,
        seatLabel: b.seat.label,
        passengerName: b.passengerName,
        passengerPhone: b.passengerPhone,
        farePaidXOF: b.farePaid,
        ticketToken: b.ticketToken,
      })),
      offerId: buildOfferId(
        first.tripId,
        first.originTripStopId,
        first.destinationTripStopId,
      ),
    };
  }

  private toDigitalTicket(booking: {
    bookingReference: string;
    ticketToken: string;
    passengerName: string;
    farePaid: number;
    company: { name: string };
    seat: { label: string };
    originTripStop: {
      scheduledDeparture: Date | null;
      terminal: { name: string; cityRelation: { name: string } | null };
    };
    destinationTripStop: {
      scheduledArrival: Date | null;
      terminal: { name: string; cityRelation: { name: string } | null };
    };
  }): DigitalTicketDTO {
    const baseUrl =
      process.env["APP_URL"] ??
      process.env["BETTER_AUTH_URL"] ??
      "http://localhost:3000";

    return {
      bookingReference: booking.bookingReference,
      ticketToken: booking.ticketToken,
      passengerName: booking.passengerName,
      seatLabel: booking.seat.label,
      companyName: booking.company.name,
      originTerminalName: booking.originTripStop.terminal.name,
      originCityName:
        booking.originTripStop.terminal.cityRelation?.name ?? "Côte d'Ivoire",
      destinationTerminalName: booking.destinationTripStop.terminal.name,
      destinationCityName:
        booking.destinationTripStop.terminal.cityRelation?.name ??
        "Côte d'Ivoire",
      departureTime:
        booking.originTripStop.scheduledDeparture ?? new Date(),
      arrivalTime:
        booking.destinationTripStop.scheduledArrival ?? new Date(),
      farePaidXOF: booking.farePaid,
      qrPayload: `${baseUrl}/tickets/${encodeURIComponent(booking.ticketToken)}`,
      status: "CONFIRMED",
    };
  }
}
