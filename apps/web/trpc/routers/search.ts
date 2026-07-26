import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { TripSearchReadRepository } from "@/features/search/repositories/search-read-repository";
import { SearchFilters, SearchService } from "@/features/search/services/search-service";
import { toSafeDisplayNumber } from "@/lib/money";

const searchInputSchema = z.object({
  originCityId: z.string(),
  destinationCityId: z.string(),
  originMunicipalityId: z.string().optional(),
  destinationMunicipalityId: z.string().optional(),
  date: z.string(),
  passengers: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().int().min(1).default(1)),
  operators: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  departureTime: z
    .array(z.enum(["MORNING", "AFTERNOON", "EVENING", "LATE_NIGHT"]))
    .optional(),
  seatClass: z
    .array(z.enum(["ECONOMY", "STANDARD", "VIP"]))
    .optional(),
  isExpress: z.array(z.enum(["true"])).optional(),
  maxPrice: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().optional()),
  sort: z.string().default("BEST"),
  page: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().int().min(1).default(1)),
});

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(searchInputSchema)
    .query(async ({ ctx, input }) => {
      let resolvedOriginId = input.originCityId;
      let resolvedDestId = input.destinationCityId;

      const normalize = (str: string) =>
        str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");

      const needsOriginResolve = !(resolvedOriginId.startsWith("c") && resolvedOriginId.length >= 20);
      const needsDestResolve = !(resolvedDestId.startsWith("c") && resolvedDestId.length >= 20);

      if (needsOriginResolve || needsDestResolve) {
        const cities = await ctx.prisma.city.findMany({
          where: { isActive: true },
        });

        if (needsOriginResolve) {
          const target = normalize(resolvedOriginId);
          const found = cities.find(
            (c) =>
              normalize(c.name) === target ||
              (c.nameEn && normalize(c.nameEn) === target)
          );
          if (found) resolvedOriginId = found.id;
        }

        if (needsDestResolve) {
          const target = normalize(resolvedDestId);
          const found = cities.find(
            (c) =>
              normalize(c.name) === target ||
              (c.nameEn && normalize(c.nameEn) === target)
          );
          if (found) resolvedDestId = found.id;
        }
      }

      const searchRepo = new TripSearchReadRepository(ctx.prisma);
      const searchService = new SearchService(searchRepo);

      return searchService.execute({
        originCityId: resolvedOriginId,
        destinationCityId: resolvedDestId,
        originMunicipalityId: input.originMunicipalityId ?? null,
        destinationMunicipalityId: input.destinationMunicipalityId ?? null,
        travelDate: new Date(input.date),
        passengerCount: input.passengers,
        filters: {
          operators: input.operators as SearchFilters['operators'],
          amenities: input.amenities as SearchFilters['amenities'],
          departureTime: input.departureTime as SearchFilters['departureTime'],
          seatClass: input.seatClass as SearchFilters['seatClass'],
          isExpress: input.isExpress?.includes("true") ?? false,
          maxPrice: input.maxPrice as SearchFilters['maxPrice'],
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
        centerDate: z.string(), // "YYYY-MM-DD"
      }),
    )
    .query(async ({ ctx, input }) => {
      const normalize = (str: string) =>
        str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");

      let originId = input.originCityId;
      let destId = input.destinationCityId;

      const needsOriginResolve = !(originId.startsWith("c") && originId.length >= 20);
      const needsDestResolve = !(destId.startsWith("c") && destId.length >= 20);

      if (needsOriginResolve || needsDestResolve) {
        const cities = await ctx.prisma.city.findMany({ where: { isActive: true } });
        if (needsOriginResolve) {
          const t = normalize(originId);
          const found = cities.find(
            (c) => normalize(c.name) === t || (c.nameEn && normalize(c.nameEn) === t),
          );
          if (found) originId = found.id;
        }
        if (needsDestResolve) {
          const t = normalize(destId);
          const found = cities.find(
            (c) => normalize(c.name) === t || (c.nameEn && normalize(c.nameEn) === t),
          );
          if (found) destId = found.id;
        }
      }

      const isUrban = originId === destId && input.originMunicipalityId && input.destinationMunicipalityId;
      const urbanOriginMuni = isUrban ? input.originMunicipalityId : undefined;
      const urbanDestMuni = isUrban ? input.destinationMunicipalityId : undefined;

      // Generate 7 UTC dates centered on centerDate (day -3 to day +3)
      const parts = input.centerDate.split("-").map(Number) as [number, number, number];
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
      const tripWhere: any = {
        status: { in: ["SCHEDULED", "DELAYED"] },
      };
      if (isUrban) {
        tripWhere.tripStops = {
          some: {
            terminal: { cityId: originId, municipalityId: urbanOriginMuni },
            isPickup: true,
            scheduledDeparture: { gte: windowStart, lte: windowEnd },
          },
        };
        tripWhere.AND = {
          tripStops: {
            some: {
              terminal: { cityId: destId, municipalityId: urbanDestMuni },
              isDropoff: true,
            },
          },
        };
      } else {
        tripWhere.tripStops = {
          some: {
            terminal: { cityId: originId },
            isPickup: true,
            scheduledDeparture: { gte: windowStart, lte: windowEnd },
          },
        };
        tripWhere.AND = {
          tripStops: {
            some: {
              terminal: { cityId: destId },
              isDropoff: true,
            },
          },
        };
      }

      const trips = await ctx.prisma.trip.findMany({
        where: tripWhere,
        include: {
          tripStops: {
            include: { terminal: { select: { cityId: true, municipalityId: true } } },
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

      // Build date → cheapest price map (match fare by segment)
      const priceByDate = new Map<string, number>();
      for (const trip of trips) {
        const originStop = trip.tripStops.find(
          (s: any) =>
            s.terminal.cityId === originId &&
            s.scheduledDeparture !== null &&
            (!isUrban || s.terminal.municipalityId === urbanOriginMuni),
        );
        if (!originStop?.scheduledDeparture) continue;
        const destStop = trip.tripStops.find(
          (s: any) =>
            s.terminal.cityId === destId &&
            (!isUrban || s.terminal.municipalityId === urbanDestMuni),
        );
        if (!destStop || originStop.stopOrder >= destStop.stopOrder) continue;

        const matchedFare = trip.schedule.fares.find(
          (f) =>
            f.fromStopOrder <= originStop.stopOrder &&
            f.toStopOrder >= destStop.stopOrder,
        );
        if (!matchedFare) continue;

        const dateStr = originStop.scheduledDeparture.toISOString().split("T")[0]!;
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