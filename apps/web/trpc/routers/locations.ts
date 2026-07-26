import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../init";

const citySearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  hierarchyLabel: z.string(),
  isMajorHub: z.boolean(),
  municipalityId: z.string().nullable().optional(),
  quarterId: z.string().nullable().optional(),
  level: z.enum(["city", "municipality", "quarter"]),
});

export const locationsRouter = createTRPCRouter({
  searchCities: publicProcedure
    .input(z.object({ query: z.string().default("") }))
    .output(z.array(citySearchResultSchema))
    .query(async ({ ctx, input }) => {
      const q = input.query;
      if (!q || q.length < 2) return [];

      const results = new Map<string, { id: string; name: string; hierarchyLabel: string; isMajorHub: boolean; municipalityId: string | null; quarterId: string | null; level: "city" | "municipality" | "quarter" }>();

      // 1. Direct city matches
      const cities = await ctx.prisma.city.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { nameEn: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { isMajorHub: "desc" },
        take: 10,
      });
      for (const c of cities) {
        if (!results.has(c.id)) {
          results.set(c.id, { id: c.id, name: c.name, hierarchyLabel: c.name, isMajorHub: c.isMajorHub, municipalityId: null, quarterId: null, level: "city" });
        }
      }

      // 2. Municipality matches (e.g. "Cocody" → "Abidjan (Cocody)")
      const municipalities = await ctx.prisma.municipality.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: "insensitive" },
          city: { isActive: true },
        },
        include: { city: true },
        take: 10,
      });
      for (const m of municipalities) {
        if (!results.has(m.city.id)) {
          results.set(m.city.id, {
            id: m.city.id,
            name: m.city.name,
            hierarchyLabel: `${m.city.name} (${m.name})`,
            isMajorHub: m.city.isMajorHub,
            municipalityId: m.id,
            quarterId: null,
            level: "municipality",
          });
        }
      }

      // 3. Quarter matches (e.g. "Riviera 3" → "Abidjan (Cocody - Riviera 3)")
      const quarters = await ctx.prisma.quarter.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: "insensitive" },
          municipality: { isActive: true, city: { isActive: true } },
        },
        include: { municipality: { include: { city: true } } },
        take: 10,
      });
      for (const qr of quarters) {
        const cityId = qr.municipality.city.id;
        if (!results.has(cityId)) {
          results.set(cityId, {
            id: cityId,
            name: qr.municipality.city.name,
            hierarchyLabel: `${qr.municipality.city.name} (${qr.municipality.name} - ${qr.name})`,
            isMajorHub: qr.municipality.city.isMajorHub,
            municipalityId: qr.municipality.id,
            quarterId: qr.id,
            level: "quarter",
          });
        }
      }

      return Array.from(results.values()).slice(0, 10);
    }),

  getCityDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.id.startsWith("c") && input.id.length >= 20) {
        const city = await ctx.prisma.city.findUnique({
          where: { id: input.id },
        });
        if (city) return city;
      }

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

  searchMunicipalities: publicProcedure
    .input(z.object({ cityId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.municipality.findMany({
        where: { cityId: input.cityId, isActive: true },
        orderBy: { isPassThrough: "asc" },
      });
    }),

  searchQuarters: publicProcedure
    .input(z.object({ municipalityId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.quarter.findMany({
        where: { municipalityId: input.municipalityId, isActive: true },
        orderBy: { name: "asc" },
      });
    }),

  suggestQuarter: publicProcedure
    .input(
      z.object({
        municipalityId: z.string(),
        name: z.string().min(1, "Quarter name is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const municipality = await ctx.prisma.municipality.findUnique({
        where: { id: input.municipalityId },
      });
      if (!municipality) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Municipality not found",
        });
      }

      return ctx.prisma.quarter.create({
        data: {
          municipalityId: input.municipalityId,
          name: input.name.trim(),
        },
      });
    }),
});
