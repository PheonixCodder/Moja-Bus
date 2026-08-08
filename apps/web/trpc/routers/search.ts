import { z } from "zod";
import {
  type GeoPlace,
  placeMatchesTerminal,
} from "@/features/search/lib/places";
import { matchSegmentFare } from "@/features/search/lib/segment-fare-match";
import { TripSearchReadRepository } from "@/features/search/repositories/search-read-repository";
import {
  type SearchFilters,
  SearchService,
} from "@/features/search/services/search-service";
import { toSafeDisplayNumber } from "@/lib/money";
import { createTRPCRouter, publicProcedure } from "../init";

const searchInputSchema = z.object({
  originCityId: z.string(),
  destinationCityId: z.string(),
  originMunicipalityId: z.string().optional(),
  destinationMunicipalityId: z.string().optional(),
  originQuarterId: z.string().optional(),
  destinationQuarterId: z.string().optional(),
  date: z.string(),
  passengers: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().int().min(1).default(1),
  ),
  operators: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  departureTime: z
    .array(z.enum(["MORNING", "AFTERNOON", "EVENING", "LATE_NIGHT"]))
    .optional(),
  seatClass: z.array(z.enum(["ECONOMY", "STANDARD", "VIP"])).optional(),
  isExpress: z.array(z.enum(["true"])).optional(),
  maxPrice: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().optional(),
  ),
  sort: z.string().default("BEST"),
  page: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().int().min(1).default(1),
  ),
});

const normalize = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

/** Resolves a non-cuid city reference (display name) to a city id via normalized match. */
function resolveCityId(
  raw: string,
  cities: { id: string; name: string; nameEn: string | null }[],
): string {
  const isCuid = raw.startsWith("c") && raw.length >= 20;
  if (isCuid) return raw;
  const target = normalize(raw);
  const found = cities.find(
    (c) =>
      normalize(c.name) === target ||
      (c.nameEn && normalize(c.nameEn) === target),
  );
  return found ? found.id : raw;
}

function toGeoPlace(
  cityId: string,
  municipalityId: string | undefined,
  quarterId: string | undefined,
): GeoPlace {
  return {
    cityId,
    municipalityId: municipalityId ?? null,
    quarterId: quarterId ?? null,
    level: quarterId ? "quarter" : municipalityId ? "municipality" : "city",
  };
}

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(searchInputSchema)
    .query(async ({ ctx, input }) => {
      const needsResolve =
        !(
          input.originCityId.startsWith("c") && input.originCityId.length >= 20
        ) ||
        !(
          input.destinationCityId.startsWith("c") &&
          input.destinationCityId.length >= 20
        );

      let cities: { id: string; name: string; nameEn: string | null }[] = [];
      if (needsResolve) {
        cities = await ctx.prisma.city.findMany({
          where: { isActive: true },
        });
      }

      const originCityId = resolveCityId(input.originCityId, cities);
      const destinationCityId = resolveCityId(input.destinationCityId, cities);

      const searchRepo = new TripSearchReadRepository(ctx.prisma);
      const searchService = new SearchService(searchRepo);

      return searchService.execute({
        origin: toGeoPlace(
          originCityId,
          input.originMunicipalityId,
          input.originQuarterId,
        ),
        destination: toGeoPlace(
          destinationCityId,
          input.destinationMunicipalityId,
          input.destinationQuarterId,
        ),
        travelDate: new Date(input.date),
        passengerCount: input.passengers,
        filters: {
          operators: input.operators as SearchFilters["operators"],
          amenities: input.amenities as SearchFilters["amenities"],
          departureTime: input.departureTime as SearchFilters["departureTime"],
          seatClass: input.seatClass as SearchFilters["seatClass"],
          isExpress: input.isExpress?.includes("true") ?? false,
          maxPrice: input.maxPrice as SearchFilters["maxPrice"],
        },
        sort: input.sort,
        page: input.page,
      });
    }),

  cheapestByDate: publicProcedure
    .input(
      z.object({
        originCityId: z.string(),
        destinationCityId: z.string(),
        originMunicipalityId: z.string().optional(),
        destinationMunicipalityId: z.string().optional(),
        originQuarterId: z.string().optional(),
        destinationQuarterId: z.string().optional(),
        centerDate: z.string(), // "YYYY-MM-DD"
      }),
    )
    .query(async ({ ctx, input }) => {
      const needsResolve =
        !(
          input.originCityId.startsWith("c") && input.originCityId.length >= 20
        ) ||
        !(
          input.destinationCityId.startsWith("c") &&
          input.destinationCityId.length >= 20
        );

      let cities: { id: string; name: string; nameEn: string | null }[] = [];
      if (needsResolve) {
        cities = await ctx.prisma.city.findMany({ where: { isActive: true } });
      }

      const originId = resolveCityId(input.originCityId, cities);
      const destId = resolveCityId(input.destinationCityId, cities);

      const originPlace = toGeoPlace(
        originId,
        input.originMunicipalityId,
        input.originQuarterId,
      );
      const destPlace = toGeoPlace(
        destId,
        input.destinationMunicipalityId,
        input.destinationQuarterId,
      );

      // Generate 7 UTC dates centered on centerDate (day -3 to day +3)
      const parts = input.centerDate.split("-").map(Number) as [
        number,
        number,
        number,
      ];
      const center = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      const dates = Array.from({ length: 7 }, (_, i) => {
        const dt = new Date(center);
        dt.setUTCDate(center.getUTCDate() + (i - 3));
        return dt;
      });

      const windowStart = new Date(dates[0]!);
      windowStart.setUTCHours(0, 0, 0, 0);
      const windowEnd = new Date(dates[6]!);
      windowEnd.setUTCHours(23, 59, 59, 999);

      // Single batch query: all trips on this route in the 7-day window
      const searchRepo = new TripSearchReadRepository(ctx.prisma);
      const trips = await searchRepo.findTripsInWindow(
        originPlace,
        destPlace,
        windowStart,
        windowEnd,
      );

      // Build date → cheapest price map (match fare by segment)
      const priceByDate = new Map<string, number>();
      for (const trip of trips) {
        const originStop = trip.tripStops.find(
          (s: any) =>
            placeMatchesTerminal(originPlace, s.terminal) &&
            s.isPickup &&
            s.scheduledDeparture !== null,
        );
        if (!originStop?.scheduledDeparture) continue;
        const destStop = trip.tripStops.find(
          (s: any) =>
            placeMatchesTerminal(destPlace, s.terminal) && s.isDropoff,
        );
        if (!destStop || originStop.stopOrder >= destStop.stopOrder) continue;

        const matchedFare = matchSegmentFare(
          trip.schedule?.fares ?? [],
          originStop.stopOrder,
          destStop.stopOrder,
          originStop.scheduledDeparture,
        );
        if (!matchedFare) continue;

        const dateStr = originStop.scheduledDeparture
          .toISOString()
          .split("T")[0]!;
        const price = toSafeDisplayNumber(matchedFare.priceXOF);
        const existing = priceByDate.get(dateStr);
        if (existing === undefined || price < existing) {
          priceByDate.set(dateStr, price);
        }
      }

      // Return 7-day result array (null = no service that day)
      return dates.map((dt) => {
        const dateStr = dt.toISOString().split("T")[0]!;
        return {
          date: dateStr,
          priceXOF: priceByDate.get(dateStr) ?? null,
        };
      });
    }),
});
