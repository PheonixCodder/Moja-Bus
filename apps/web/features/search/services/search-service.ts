import type { TripSearchReadRepository } from "../repositories/search-read-repository";
import type { SearchOffer, SearchResponse, Amenity } from "@moja/types";

export interface SearchFilters {
  operators: string[];
  amenities: string[];
  departureTime: ("MORNING" | "AFTERNOON" | "EVENING")[];
  seatClass?: ("ECONOMY" | "STANDARD" | "VIP")[] | undefined;
  maxPrice?: number | undefined;
}

export interface SearchContext {
  originCityId: string;
  destinationCityId: string;
  travelDate: Date;
  passengerCount: number;
  filters: SearchFilters;
  sort: string;
  page: number;
}

export class SearchService {
  constructor(private searchRepo: TripSearchReadRepository) {}

  async execute(ctx: SearchContext): Promise<SearchResponse> {
    // 1. Resolve candidate trips based on geographic route + date
    const rawTrips = await this.searchRepo.findCandidateTrips(
      ctx.originCityId,
      ctx.destinationCityId,
      ctx.travelDate,
    );

    // 2. Stop resolution & Chronological validation (Origin stop comes before Destination stop)
    const candidates = [];

    for (const trip of rawTrips) {
      // Find pickup stop in origin city on target date
      const originStop = trip.tripStops.find(
        (stop) =>
          stop.terminal.cityId === ctx.originCityId &&
          stop.isPickup &&
          stop.scheduledDeparture,
      );

      // Find dropoff stop in destination city
      const destStop = trip.tripStops.find(
        (stop) =>
          stop.terminal.cityId === ctx.destinationCityId && stop.isDropoff,
      );

      if (
        originStop &&
        destStop &&
        originStop.stopOrder < destStop.stopOrder &&
        originStop.scheduledDeparture
      ) {
        candidates.push({
          trip,
          originStop,
          destStop,
          searchOriginOrder: originStop.stopOrder,
          searchDestinationOrder: destStop.stopOrder,
        });
      }
    }

    // 3. Compute dynamic segment availability using set-based SQL aggregation counts
    const occupancyData = await this.searchRepo.getSegmentOccupancy(
      candidates.map((c) => ({
        id: c.trip.id,
        searchOriginOrder: c.searchOriginOrder,
        searchDestinationOrder: c.searchDestinationOrder,
      })),
    );

    // 4. Transform candidate trips into Journey Offers with pricing, timeline, and amenities.
    // Never invent prices — omit trips without an active matching segment fare.
    let offers: SearchOffer[] = candidates.flatMap((item) => {
      const { trip, originStop, destStop } = item;

      const segmentFare = trip.schedule.fares.find(
        (f) =>
          f.fromStopOrder <= item.searchOriginOrder &&
          f.toStopOrder >= item.searchDestinationOrder &&
          f.isActive &&
          (!f.validFrom || trip.departureDate.getTime() >= f.validFrom.getTime()) &&
          (!f.validUntil || trip.departureDate.getTime() <= f.validUntil.getTime()),
      );
      if (!segmentFare) {
        return [];
      }
      const baseFare = segmentFare.priceXOF;
      const priceXOF = baseFare * ctx.passengerCount;

      // Amenities mapping
      const amenitiesList: Amenity[] = [];
      const layout = trip.bus.layoutTemplate;
      if (layout.hasAC) amenitiesList.push("AC");
      if (layout.hasWifi) amenitiesList.push("WIFI");
      if (layout.hasToilet) amenitiesList.push("TOILET");
      if (layout.hasLuggage) amenitiesList.push("LUGGAGE");

      // Compute availability metrics — prioritize template's configured bookable seat count
      const activeSeatsCount = trip.bus.seats.filter(
        (s) =>
          s.isActive &&
          s.seatType !== "DRIVER_AREA" &&
          s.seatType !== "EMPTY_SPACE",
      ).length;
      const totalSeats =
        layout?.totalSeats && layout.totalSeats > 0 && layout.totalSeats < activeSeatsCount
          ? layout.totalSeats
          : activeSeatsCount || layout?.totalSeats || trip.totalSeats;
      const occupiedSeats = occupancyData.get(trip.id) ?? 0;
      const remainingSeats = Math.max(0, totalSeats - occupiedSeats);

      let status: "AVAILABLE" | "FEW_LEFT" | "SOLD_OUT" = "AVAILABLE";
      if (remainingSeats === 0) {
        status = "SOLD_OUT";
      } else if (remainingSeats <= 5) {
        status = "FEW_LEFT";
      }

      const durationMinutes = Math.round(
        (destStop.scheduledArrival!.getTime() -
          originStop.scheduledDeparture!.getTime()) /
          60000,
      );

      const stopCount = Math.max(
        0,
        item.searchDestinationOrder - item.searchOriginOrder - 1,
      );

      return [
        {
          offerId: `${trip.id}_${originStop.id}_${destStop.id}`,
          tripId: trip.id,
          companyId: trip.company.id,
          companyName: trip.company.name,
          companyLogoUrl: trip.company.logoUrl,
          companyRating: null, // Expanded when reviews feature is active
          originTerminalId: originStop.terminal.id,
          originTerminalName: originStop.terminal.name,
          originCityName:
            originStop.terminal.cityRelation?.name ?? "Côte d'Ivoire",
          destinationTerminalId: destStop.terminal.id,
          destinationTerminalName: destStop.terminal.name,
          destinationCityName:
            destStop.terminal.cityRelation?.name ?? "Côte d'Ivoire",
          departureTime: originStop.scheduledDeparture!,
          arrivalTime: destStop.scheduledArrival!,
          durationMinutes,
          stopCount,
          isExpress: stopCount === 0,
          priceXOF,
          busId: trip.bus.id,
          busTypeName: trip.bus.busType.name,
          seatClass: trip.bus.seatClass,
          amenities: amenitiesList,
          availability: {
            remaining: remainingSeats,
            occupied: occupiedSeats,
            total: totalSeats,
            status,
          },
        },
      ];
    });

    // 5. Apply business filters
    if (ctx.filters.operators && ctx.filters.operators.length > 0) {
      offers = offers.filter((o) =>
        ctx.filters.operators?.includes(o.companyId),
      );
    }

    if (ctx.filters.amenities && ctx.filters.amenities.length > 0) {
      offers = offers.filter((o) =>
        ctx.filters.amenities?.every((a) => o.amenities.includes(a as Amenity)),
      );
    }

    if (ctx.filters.seatClass && ctx.filters.seatClass.length > 0) {
      offers = offers.filter((o) =>
        ctx.filters.seatClass?.includes(o.seatClass),
      );
    }

    if (ctx.filters.departureTime && ctx.filters.departureTime.length > 0) {
      offers = offers.filter((o) => {
        const hour = o.departureTime.getUTCHours();
        if (
          ctx.filters.departureTime?.includes("MORNING") &&
          hour >= 5 &&
          hour < 12
        )
          return true;
        if (
          ctx.filters.departureTime?.includes("AFTERNOON") &&
          hour >= 12 &&
          hour < 17
        )
          return true;
        if (
          ctx.filters.departureTime?.includes("EVENING") &&
          (hour >= 17 || hour < 5)
        )
          return true;
        return false;
      });
    }

    if (ctx.filters.maxPrice !== undefined) {
      offers = offers.filter((o) => o.priceXOF <= ctx.filters.maxPrice!);
    }

    // 6. Apply sorting
    if (ctx.sort === "CHEAPEST") {
      offers.sort((a, b) => a.priceXOF - b.priceXOF);
    } else if (ctx.sort === "FASTEST") {
      offers.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (ctx.sort === "EARLIEST") {
      offers.sort(
        (a, b) => a.departureTime.getTime() - b.departureTime.getTime(),
      );
    } else if (ctx.sort === "LATEST") {
      offers.sort(
        (a, b) => b.departureTime.getTime() - a.departureTime.getTime(),
      );
    } else if (ctx.sort === "MOST_AVAILABLE") {
      offers.sort(
        (a, b) => b.availability.remaining - a.availability.remaining,
      );
    } else {
      // DEFAULT / BEST sorting logic
      // Weighted score combining: price (40%), duration (40%), seat availability (20%)
      offers.sort((a, b) => {
        const scoreA =
          (a.priceXOF / 5000) * 0.4 +
          (a.durationMinutes / 180) * 0.4 -
          (a.availability.remaining / 50) * 0.2;
        const scoreB =
          (b.priceXOF / 5000) * 0.4 +
          (b.durationMinutes / 180) * 0.4 -
          (b.availability.remaining / 50) * 0.2;
        return scoreA - scoreB;
      });
    }

    // 7. Apply Pagination
    const pageSize = 15;
    const offset = (ctx.page - 1) * pageSize;
    const paginatedOffers = offers.slice(offset, offset + pageSize);
    const hasNextPage = offset + pageSize < offers.length;

    return {
      offers: paginatedOffers,
      total: offers.length,
      hasNextPage,
      nextCursor: hasNextPage ? String(ctx.page + 1) : null,
    };
  }
}
