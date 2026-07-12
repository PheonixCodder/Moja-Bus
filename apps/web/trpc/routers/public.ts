import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";
import { TRPCError } from "@trpc/server";

export const publicRouter = createTRPCRouter({
  getNotificationToken: protectedProcedure.query(async ({ ctx }) => {
    const secret = process.env['NOVU_SECRET_KEY'];
    if (!secret) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Notification secret is not configured on server",
      });
    }

    const subscriberId = ctx.user.email;
    const crypto = await import("crypto");
    const subscriberHash = crypto
      .createHmac("sha256", secret)
      .update(subscriberId)
      .digest("hex");

    return {
      subscriberId,
      subscriberHash,
      appId: process.env['NEXT_PUBLIC_NOVU_APP_ID'] || "",
    };
  }),

  /**
   * List all verified + active operators safe for public display.
   * Excludes all sensitive fields (bank, tax IDs, documents, staff).
   */
  listOperators: publicProcedure.query(async ({ ctx }) => {
    const companies = await ctx.prisma.company.findMany({
      where: {
        status: { in: ["ACTIVE", "VERIFIED"] },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logoUrl: true,
        yearEstablished: true,
        website: true,
        _count: {
          select: {
            routes: true,
            fleet: true,
          },
        },
        locations: {
          where: { isTerminal: true, isActive: true },
          select: {
            cityRelation: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return companies.map((c) => ({
      ...c,
      cityNames: [
        ...new Set(
          c.locations
            .map((l) => l.cityRelation?.name)
            .filter((n): n is string => !!n),
        ),
      ],
    }));
  }),

  /**
   * Get a single operator by slug for public profile page.
   * Returns 404 if company is not yet verified/active.
   */
  getOperator: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findFirst({
        where: {
          slug: input.slug,
          status: { in: ["ACTIVE", "VERIFIED"] },
        },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          logoUrl: true,
          yearEstablished: true,
          website: true,
          phone: true,
          email: true,
          _count: {
            select: {
              routes: true,
              fleet: true,
            },
          },
          routes: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              name: true,
              distanceKm: true,
              estimatedMinutes: true,
              originTerminal: {
                select: {
                  name: true,
                  city: true,
                  cityRelation: { select: { id: true, name: true } },
                },
              },
              destTerminal: {
                select: {
                  name: true,
                  city: true,
                  cityRelation: { select: { id: true, name: true } },
                },
              },
              schedules: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  departureTime: true,
                  fares: {
                    where: { isActive: true },
                    orderBy: { priceXOF: "asc" },
                    take: 1,
                    select: { priceXOF: true },
                  },
                },
              },
            },
            orderBy: { name: "asc" },
          },
          locations: {
            where: { isTerminal: true, isActive: true },
            select: {
              id: true,
              name: true,
              addressLine1: true,
              city: true,
              phone: true,
              managerName: true,
              operatingHours: true,
              cityRelation: { select: { name: true } },
              latitude: true,
              longitude: true,
            },
          },
        },
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Operator not found or not yet verified.",
        });
      }

      return company;
    }),
});
