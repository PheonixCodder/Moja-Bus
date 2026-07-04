import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { TripSearchReadRepository } from "@/features/search/repositories/search-read-repository";
import { SearchFilters, SearchService } from "@/features/search/services/search-service";

const searchInputSchema = z.object({
  originCityId: z.string(),
  destinationCityId: z.string(),
  date: z.string(),
  passengers: z.coerce.number().int().min(1).default(1),
  operators: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  departureTime: z
    .array(z.enum(["MORNING", "AFTERNOON", "EVENING"]))
    .optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.string().default("BEST"),
  page: z.coerce.number().int().min(1).default(1),
});

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(searchInputSchema)
    .query(async ({ ctx, input }) => {
      const searchRepo = new TripSearchReadRepository(ctx.prisma);
      const searchService = new SearchService(searchRepo);

      return searchService.execute({
        originCityId: input.originCityId,
        destinationCityId: input.destinationCityId,
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