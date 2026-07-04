import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type { Amenity, TripDetails } from "@moja/types";
import { buildOfferId, parseOfferId } from "@moja/types";
import { TripSearchReadRepository } from "@/features/search/repositories/search-read-repository";
import { isActiveBookingStatus, segmentsOverlap } from "../lib/segment-overlap";

const BOOKABLE_TRIP_STATUSES = ["SCHEDULED", "DELAYED", "BOARDING"] as const;

export class TripDetailsService {
  constructor(private prisma: PrismaClient) {}

  async getTripDetails(offerId: string): Promise<TripDetails> {
    const { tripId, originTripStopId, destinationTripStopId } =
      parseOfferId(offerId);

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
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
            terminal: { include: { cityRelation: true } },
          },
          orderBy: { stopOrder: "asc" },
        },
        schedule: {
          include: {
            fares: { where: { isActive: true } },
          },
        },
      },
    });

    if (!trip) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
    }

    if (
      !BOOKABLE_TRIP_STATUSES.includes(
        trip.status as (typeof BOOKABLE_TRIP_STATUSES)[number],
      )
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This trip is no longer available for booking",
      });
    }

    const originStop = trip.tripStops.find((s) => s.id === originTripStopId);
    const destStop = trip.tripStops.find(
      (s) => s.id === destinationTripStopId,
    );

    if (!originStop || !destStop || !originStop.scheduledDeparture) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Journey segment not found for this offer",
      });
    }

    if (
      originStop.stopOrder >= destStop.stopOrder ||
      !destStop.scheduledArrival
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid journey segment",
      });
    }

    const boardingStopOrder = originStop.stopOrder;
    const dropoffStopOrder = destStop.stopOrder;

    const segmentFare = trip.schedule.fares.find(
      (f) =>
        f.fromStopOrder <= boardingStopOrder &&
        f.toStopOrder >= dropoffStopOrder &&
        f.isActive,
    );
    const fallbackFare = trip.schedule.fares.find((f) => f.isActive);
    const priceXOF = segmentFare?.priceXOF ?? fallbackFare?.priceXOF ?? 5000;

    const searchRepo = new TripSearchReadRepository(this.prisma);
    const occupancy = await searchRepo.getSegmentOccupancy([
      {
        id: trip.id,
        searchOriginOrder: boardingStopOrder,
        searchDestinationOrder: dropoffStopOrder,
      },
    ]);
    const occupiedSeats = occupancy.get(trip.id) ?? 0;
    const totalSeats = trip.totalSeats;
    const remainingSeats = Math.max(0, totalSeats - occupiedSeats);

    let availabilityStatus: "AVAILABLE" | "FEW_LEFT" | "SOLD_OUT" = "AVAILABLE";
    if (remainingSeats === 0) availabilityStatus = "SOLD_OUT";
    else if (remainingSeats <= 5) availabilityStatus = "FEW_LEFT";

    const amenitiesList: Amenity[] = [];
    const layout = trip.bus.layoutTemplate;
    if (layout.hasAC) amenitiesList.push("AC");
    if (layout.hasWifi) amenitiesList.push("WIFI");
    if (layout.hasToilet) amenitiesList.push("TOILET");
    if (layout.hasLuggage) amenitiesList.push("LUGGAGE");

    const durationMinutes = Math.round(
      (destStop.scheduledArrival.getTime() -
        originStop.scheduledDeparture.getTime()) /
        60000,
    );
    const stopCount = Math.max(0, dropoffStopOrder - boardingStopOrder - 1);

    const segmentStops = trip.tripStops.filter(
      (s) =>
        s.stopOrder >= boardingStopOrder && s.stopOrder <= dropoffStopOrder,
    );

    return {
      offerId: buildOfferId(tripId, originTripStopId, destinationTripStopId),
      tripId: trip.id,
      companyId: trip.company.id,
      companyName: trip.company.name,
      companyLogoUrl: trip.company.logoUrl,
      originTerminalId: originStop.terminal.id,
      originTerminalName: originStop.terminal.name,
      originCityName:
        originStop.terminal.cityRelation?.name ?? "Côte d'Ivoire",
      destinationTerminalId: destStop.terminal.id,
      destinationTerminalName: destStop.terminal.name,
      destinationCityName:
        destStop.terminal.cityRelation?.name ?? "Côte d'Ivoire",
      originTripStopId: originStop.id,
      destinationTripStopId: destStop.id,
      boardingStopOrder,
      dropoffStopOrder,
      departureTime: originStop.scheduledDeparture,
      arrivalTime: destStop.scheduledArrival,
      durationMinutes,
      stopCount,
      isExpress: stopCount === 0,
      priceXOF,
      busId: trip.bus.id,
      busTypeName: trip.bus.busType.name,
      amenities: amenitiesList,
      tripStatus: trip.status,
      availability: {
        remaining: remainingSeats,
        occupied: occupiedSeats,
        total: totalSeats,
        status: availabilityStatus,
      },
      stops: segmentStops.map((s) => ({
        id: s.id,
        stopOrder: s.stopOrder,
        terminalName: s.terminal.name,
        cityName: s.terminal.cityRelation?.name ?? "Côte d'Ivoire",
        scheduledDeparture: s.scheduledDeparture,
        scheduledArrival: s.scheduledArrival,
        isPickup: s.isPickup,
        isDropoff: s.isDropoff,
      })),
    };
  }

  /** Used by hold service to resolve segment + price inside transactions */
  async resolveSegment(offerId: string) {
    const details = await this.getTripDetails(offerId);
    return details;
  }
}

export { isActiveBookingStatus, segmentsOverlap };