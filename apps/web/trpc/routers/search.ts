import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { TripSearchReadRepository } from "@/features/search/repositories/search-read-repository";
import { SearchFilters, SearchService } from "@/features/search/services/search-service";

const searchInputSchema = z.object({
  originCityId: z.string(),
  destinationCityId: z.string(),
  date: z.string(),
  passengers: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().int().min(1).default(1)),
  operators: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  departureTime: z
    .array(z.enum(["MORNING", "AFTERNOON", "EVENING"]))
    .optional(),
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
        travelDate: new Date(input.date),
        passengerCount: input.passengers,
        filters: {
          operators: input.operators as SearchFilters['operators'],
          amenities: input.amenities  as SearchFilters['amenities'],
          departureTime: input.departureTime as SearchFilters['departureTime'],
          maxPrice: input.maxPrice as SearchFilters['maxPrice'],
        },
        sort: input.sort,
        page: input.page,
      });
    }),
});