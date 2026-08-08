import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { buildSearchEntries } from "@/features/search/lib/build-search-entries";
import { geocodePoint } from "@/lib/geo/geocode-point";
import { loadGeoDataset } from "@/lib/geo/load-geo-dataset";
import { createRateLimiter } from "@/lib/rate-limit";
import { createTRPCRouter, publicProcedure } from "../init";

const suggestQuarterLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
});

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

      return buildSearchEntries(cities, municipalities, quarters, 10);
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
            (c.nameEn && normalize(c.nameEn) === target),
        ) || null
      );
    }),

  getGeoPlaceLabel: publicProcedure
    .input(
      z.object({
        cityId: z.string(),
        municipalityId: z.string().optional(),
        quarterId: z.string().optional(),
      }),
    )
    .output(
      z.object({
        cityName: z.string(),
        municipalityName: z.string().nullable(),
        quarterName: z.string().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const normalize = (str: string) =>
        str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");

      let city = null;
      if (input.cityId.startsWith("c") && input.cityId.length >= 20) {
        city = await ctx.prisma.city.findUnique({
          where: { id: input.cityId },
        });
      }
      if (!city) {
        const cities = await ctx.prisma.city.findMany({
          where: { isActive: true },
        });
        const target = normalize(input.cityId);
        city =
          cities.find(
            (c) =>
              normalize(c.name) === target ||
              (c.nameEn && normalize(c.nameEn) === target),
          ) || null;
      }

      if (!city) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "City not found",
        });
      }

      let municipalityName: string | null = null;
      if (input.municipalityId) {
        const municipality = await ctx.prisma.municipality.findUnique({
          where: { id: input.municipalityId },
        });
        municipalityName = municipality?.name ?? null;
      }

      let quarterName: string | null = null;
      if (input.quarterId) {
        const quarter = await ctx.prisma.quarter.findUnique({
          where: { id: input.quarterId },
        });
        quarterName = quarter?.name ?? null;
      }

      return {
        cityName: city.name,
        municipalityName,
        quarterName,
      };
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
      const forwarded = ctx.headers.get("x-forwarded-for");
      const ip =
        forwarded?.split(",")[0]?.trim() ||
        ctx.headers.get("x-real-ip") ||
        "unknown";
      const gate = suggestQuarterLimiter(`suggestQuarter:${ip}`);
      if (!gate.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many quarter suggestions. Try again in ${Math.ceil(gate.retryAfterMs / 1000)}s.`,
        });
      }

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

  geocodePoint: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }),
    )
    .output(
      z.object({
        cityId: z.string(),
        cityName: z.string(),
        municipalityId: z.string(),
        municipalityName: z.string(),
        quarterId: z.string().nullable(),
        quarterName: z.string().nullable(),
        method: z.enum(["polygon", "nearest"]),
        distanceMeters: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { municipalities, quarters } = await loadGeoDataset(ctx.prisma);

      const resolved = geocodePoint({
        latitude: input.latitude,
        longitude: input.longitude,
        municipalities,
        quarters,
      });
      if (!resolved) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Could not resolve coordinates to a location.",
        });
      }
      return resolved;
    }),
});
