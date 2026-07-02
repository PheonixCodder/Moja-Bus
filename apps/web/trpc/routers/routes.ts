import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";

export const routesRouter = createTRPCRouter({
  list: operatorCompanyProcedure.query(async ({ ctx }) => {
    return ctx.prisma.route.findMany({
      where: {
        companyId: ctx.companyId,
      },
      include: {
        originTerminal: { include: { cityRelation: true } },
        destTerminal: { include: { cityRelation: true } },
        _count: {
          select: { waypoints: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }),

  getCities: operatorCompanyProcedure.query(async ({ ctx }) => {
    return ctx.prisma.city.findMany({
      orderBy: { name: "asc" },
    });
  }),

  get: operatorCompanyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const route = await ctx.prisma.route.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          originTerminal: true,
          destTerminal: true,
          waypoints: {
            include: {
              terminal: true,
            },
            orderBy: { stopOrder: "asc" },
          },
        },
      });

      if (!route) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
      }

      return route;
    }),

  create: operatorCompanyProcedure
    .input(z.any())
    .mutation(async ({ ctx, input }) => {
      const { createRouteSchema } = await import("@moja/schemas");
      const parsed = createRouteSchema.safeParse(input);

      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: parsed.error,
        });
      }

      const data = parsed.data;

      return ctx.prisma.route.create({
        data: {
          companyId: ctx.companyId,
          name: data.name,
          originTerminalId: data.originTerminalId,
          destTerminalId: data.destTerminalId,
          distanceKm: data.distanceKm ?? null,
          estimatedMinutes: data.estimatedDurationMin ?? null,
          status: data.status,
          waypoints: {
            create: data.waypoints.map((wp) => ({
              terminalId: wp.terminalId,
              stopOrder: wp.stopOrder,
              arrivalOffsetMinutes: wp.offsetMinutes,
              departureOffsetMinutes: wp.offsetMinutes, // Simplification
              isPickup: wp.allowPickup,
              isDropoff: wp.allowDropoff,
            })),
          },
        },
        include: {
          originTerminal: true,
          destTerminal: true,
          waypoints: true,
        },
      });
    }),

  update: operatorCompanyProcedure
    .input(z.object({ id: z.string().uuid(), data: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const { updateRouteSchema } = await import("@moja/schemas");
      const parsed = updateRouteSchema.safeParse(input.data);

      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: parsed.error,
        });
      }

      const existingRoute = await ctx.prisma.route.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!existingRoute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
      }

      const data = parsed.data;

      // Update basic details
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.originTerminalId !== undefined)
        updateData.originTerminalId = data.originTerminalId;
      if (data.destTerminalId !== undefined)
        updateData.destTerminalId = data.destTerminalId;
      if (data.distanceKm !== undefined)
        updateData.distanceKm = data.distanceKm;
      if (data.estimatedDurationMin !== undefined)
        updateData.estimatedMinutes = data.estimatedDurationMin;
      if (data.status !== undefined) updateData.status = data.status;

      // Handle waypoints if provided
      if (data.waypoints) {
        // Delete all old ones and insert new ones
        await ctx.prisma.routeWaypoint.deleteMany({
          where: { routeId: input.id },
        });

        updateData.waypoints = {
          create: data.waypoints.map((wp) => ({
            terminalId: wp.terminalId,
            stopOrder: wp.stopOrder,
            arrivalOffsetMinutes: wp.offsetMinutes,
            departureOffsetMinutes: wp.offsetMinutes,
            isPickup: wp.allowPickup,
            isDropoff: wp.allowDropoff,
          })),
        };
      }

      return ctx.prisma.route.update({
        where: { id: input.id },
        data: updateData,
        include: {
          originTerminal: true,
          destTerminal: true,
          waypoints: true,
        },
      });
    }),

  delete: operatorCompanyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingRoute = await ctx.prisma.route.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!existingRoute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
      }

      await ctx.prisma.route.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
