import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";

export const locationsRouter = createTRPCRouter({
  searchCities: publicProcedure
    .input(z.object({ query: z.string().default("") }))
    .query(async ({ ctx, input }) => {
      // Find cities matching query (case-insensitive)
      return ctx.prisma.city.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: input.query, mode: "insensitive" } },
            { nameEn: { contains: input.query, mode: "insensitive" } },
          ],
        },
        orderBy: { isMajorHub: "desc" },
        take: 10,
      });
    }),

  getCityDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.city.findFirst({
        where: { id: input.id },
      });
    }),
});
