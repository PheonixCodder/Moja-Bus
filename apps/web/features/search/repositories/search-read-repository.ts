import type { PrismaClient } from "@moja/db";

export class TripSearchReadRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Finds candidate trips that run on a given day and stop in both cities.
   * Note: Enforcing the stop order index (origin < destination) is handled
   * during pipeline orchestration.
   */
  async findCandidateTrips(
    originCityId: string,
    destinationCityId: string,
    date: Date,
  ) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.prisma.trip.findMany({
      where: {
        status: { in: ["SCHEDULED", "DELAYED"] },
        schedule: { isActive: true },
        tripStops: {
          some: {
            terminal: { cityId: originCityId },
            isPickup: true,
            scheduledDeparture: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
        AND: {
          tripStops: {
            some: {
              terminal: { cityId: destinationCityId },
              isDropoff: true,
            },
          },
        },
      },
      include: {
        company: true,
        bus: {
          include: {
            busType: true,
            layoutTemplate: true,
          },
        },
        tripStops: {
          include: {
            terminal: {
              include: { cityRelation: true },
            },
          },
          orderBy: { stopOrder: "asc" },
        },
        schedule: {
          include: {
            fares: {
              where: { isActive: true },
            },
          },
        },
      },
    });
  }

  /**
   * Computes the number of occupied seats per trip for their specific segment stop ranges.
   * An active lock (PENDING_PAYMENT) is counted if it hasn't expired yet.
   */
  async getSegmentOccupancy(
    candidateTrips: {
      id: string;
      searchOriginOrder: number;
      searchDestinationOrder: number;
    }[],
  ) {
    if (candidateTrips.length === 0) {
      return new Map<string, number>();
    }

    const activeHoldsThreshold = new Date();

    const occupiedCounts = await this.prisma.booking.groupBy({
      by: ["tripId"],
      where: {
        OR: candidateTrips.map((trip) => ({
          tripId: trip.id,
          boardingStopOrder: { lt: trip.searchDestinationOrder },
          dropoffStopOrder: { gt: trip.searchOriginOrder },
          OR: [
            { status: "CONFIRMED" },
            {
              status: "PENDING_PAYMENT",
              holdExpiresAt: { gt: activeHoldsThreshold },
            },
          ],
        })),
      },
      _count: {
        seatId: true,
      },
    });

    return new Map<string, number>(
      occupiedCounts.map((c) => [c.tripId, c._count.seatId]),
    );
  }
}
