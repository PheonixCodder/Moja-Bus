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
      // 1. Try direct ID first if it looks like a CUID
      if (input.id.startsWith("c") && input.id.length >= 20) {
        const city = await ctx.prisma.city.findUnique({
          where: { id: input.id },
        });
        if (city) return city;
      }

      // 2. Otherwise, resolve by name (ignoring casing, accents, and symbols)
      const cities = await ctx.prisma.city.findMany({
        where: { isActive: true },
      });

      const normalize = (str: string) =>
        str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");

      const target = normalize(input.id);
      return (
        cities.find(
          (c) =>
            normalize(c.name) === target ||
            (c.nameEn && normalize(c.nameEn) === target)
        ) || null
      );
    }),
});
