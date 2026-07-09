import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";
import { createRouteSchema, updateRouteSchema } from "@moja/schemas";

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
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }),

  get: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const route = await ctx.prisma.route.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          originTerminal: { include: { cityRelation: true } },
          destTerminal: { include: { cityRelation: true } },
          waypoints: {
            include: {
              terminal: { include: { cityRelation: true } },
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
    .input(createRouteSchema)
    .mutation(async ({ ctx, input }) => {
      const data = input;

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
              distanceFromOriginKm: wp.distanceFromOriginKm ?? null,
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
    .input(z.object({ id: z.string(), data: updateRouteSchema }))
    .mutation(async ({ ctx, input }) => {
      const existingRoute = await ctx.prisma.route.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!existingRoute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
      }

      const data = input.data;

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
      let updatedRoute;
      if (data.waypoints) {
        updatedRoute = await ctx.prisma.$transaction(async (tx) => {
          await tx.routeWaypoint.deleteMany({
            where: { routeId: input.id },
          });

          return tx.route.update({
            where: { id: input.id },
            data: {
              ...updateData,
              waypoints: {
                create: data.waypoints!.map((wp) => ({
                  terminalId: wp.terminalId,
                  stopOrder: wp.stopOrder,
                  arrivalOffsetMinutes: wp.offsetMinutes,
                  departureOffsetMinutes: wp.offsetMinutes,
                  isPickup: wp.allowPickup,
                  isDropoff: wp.allowDropoff,
                  distanceFromOriginKm: wp.distanceFromOriginKm ?? null,
                })),
              },
            },
            include: {
              originTerminal: true,
              destTerminal: true,
              waypoints: true,
            },
          });
        });
      }

      } else {
        updatedRoute = await ctx.prisma.route.update({
          where: { id: input.id },
          data: updateData,
          include: {
            originTerminal: true,
            destTerminal: true,
            waypoints: true,
          },
        });
      }

      const futureTripsCount = await ctx.prisma.trip.count({
        where: {
          schedule: { routeId: input.id },
          departureDate: { gt: new Date() },
          bookedSeats: 0,
        },
      });

      return {
        route: updatedRoute,
        needsReconciliation: futureTripsCount > 0,
      };
    }),

  delete: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
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
