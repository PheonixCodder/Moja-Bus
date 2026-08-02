import type { Amenity, SearchOffer, SearchResponse } from "@moja/types";
import { computeAvailabilityStatus } from "../lib/availability";
import { type GeoPlace, isUrban, placeMatchesTerminal } from "../lib/places";
import { matchSegmentFare } from "../lib/segment-fare-match";
import type { TripSearchReadRepository } from "../repositories/search-read-repository";

export interface SearchFilters {
  operators: string[];
  amenities: string[];
  departureTime: ("MORNING" | "AFTERNOON" | "EVENING" | "LATE_NIGHT")[];
  seatClass?: ("ECONOMY" | "STANDARD" | "VIP")[] | undefined;
  isExpress?: boolean | undefined;
  maxPrice?: number | undefined;
}

export interface SearchContext {
  origin: GeoPlace;
  destination: GeoPlace;
  travelDate: Date;
  passengerCount: number;
  filters: SearchFilters;
  sort: string;
  page: number;
}

export class SearchService {
  constructor(private searchRepo: TripSearchReadRepository) {}

  async execute(ctx: SearchContext): Promise<SearchResponse> {
    const urban = isUrban(ctx.origin, ctx.destination);

    // 1. Resolve candidate trips based on geographic route + date + SQL filters
    const rawTrips = await this.searchRepo.findTrips(
      ctx.origin,
      ctx.destination,
      ctx.travelDate,
      ctx.filters,
    );

    // 2. Stop resolution & Chronological validation (Origin stop comes before Destination stop)
    const candidates = [];

    for (const trip of rawTrips) {
      const originStop = trip.tripStops.find(
        (stop) =>
          placeMatchesTerminal(ctx.origin, stop.terminal) &&
          stop.isPickup &&
          stop.scheduledDeparture,
      );

      const destStop = trip.tripStops.find(
        (stop) =>
          placeMatchesTerminal(ctx.destination, stop.terminal) &&
          stop.isDropoff,
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

      const segmentFare = matchSegmentFare(
        trip.schedule.fares,
        item.searchOriginOrder,
        item.searchDestinationOrder,
        trip.departureDate,
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

      // Trip.totalSeats is kept in sync by toggleSeatStatus — active,
      // bookable, non-structural seats only (see fleet seat derivation chain).
      const totalSeats = trip.totalSeats;
      const occupiedSeats = occupancyData.get(trip.id) ?? 0;
      const remainingSeats = Math.max(0, totalSeats - occupiedSeats);

      const status = computeAvailabilityStatus(
        remainingSeats,
        ctx.passengerCount,
      );

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
          serviceType: trip.serviceType,
          companyId: trip.company.id,
          companyName: trip.company.name,
          companyLogoUrl: trip.company.logoUrl,
          companyRating: null, // Expanded when reviews feature is active
          originTerminalId: originStop.terminal.id,
          originTerminalName: originStop.terminal.name,
          originCityName:
            originStop.terminal.cityRelation?.name ?? "Côte d'Ivoire",
          originMunicipalityName:
            originStop.terminal.municipality?.name ?? null,
          originQuarterName: originStop.terminal.quarter?.name ?? null,
          destinationTerminalId: destStop.terminal.id,
          destinationTerminalName: destStop.terminal.name,
          destinationCityName:
            destStop.terminal.cityRelation?.name ?? "Côte d'Ivoire",
          destinationMunicipalityName:
            destStop.terminal.municipality?.name ?? null,
          destinationQuarterName: destStop.terminal.quarter?.name ?? null,
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

    // 5. Apply business filters (operators/amenities/seatClass/departureTime
    // are pushed into SQL in buildTripWhere; only fare-derived filters remain)

    if (ctx.filters.maxPrice !== undefined) {
      offers = offers.filter((o) => o.priceXOF <= ctx.filters.maxPrice!);
    }

    if (ctx.filters.isExpress) {
      offers = offers.filter((o) => o.isExpress);
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
      // Urban trips use tighter normalization (shorter distances, cheaper fares)
      offers.sort((a, b) => {
        const priceNorm = urban ? 1000 : 5000;
        const durationNorm = urban ? 60 : 180;
        const seatsNorm = urban ? 30 : 50;
        const scoreA =
          (a.priceXOF / priceNorm) * 0.4 +
          (a.durationMinutes / durationNorm) * 0.4 -
          (a.availability.remaining / seatsNorm) * 0.2;
        const scoreB =
          (b.priceXOF / priceNorm) * 0.4 +
          (b.durationMinutes / durationNorm) * 0.4 -
          (b.availability.remaining / seatsNorm) * 0.2;
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
