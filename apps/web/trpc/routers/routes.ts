import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";
import { requirePermission, requireAnyPermission } from "@/lib/permissions/authorize";
import { createRouteSchema, updateRouteSchema } from "@moja/schemas";

export const routesRouter = createTRPCRouter({
  list: operatorCompanyProcedure
    .input(z.object({ showArchived: z.boolean().optional().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "routes:read");
      return ctx.prisma.route.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.showArchived ? {} : { status: { not: "ARCHIVED" } }),
        },
        include: {
          originTerminal: { include: { cityRelation: true } },
          destTerminal: { include: { cityRelation: true } },
          _count: {
            select: { waypoints: true, schedules: true },
          },
        },
        orderBy: { name: "asc" },
      });
    }),

  getCities: operatorCompanyProcedure.query(async ({ ctx }) => {
    requireAnyPermission(ctx, ["routes:read", "terminals:read"]);
    return ctx.prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }),

  get: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "routes:read");
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
      requirePermission(ctx, "routes:create");
      const data = input;

      if (data.originTerminalId === data.destTerminalId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Origin and destination terminals must be different.",
        });
      }

      // Guard: Route name must be unique per company
      const existingName = await ctx.prisma.route.findFirst({
        where: {
          companyId: ctx.companyId,
          name: data.name.trim(),
          status: { not: "ARCHIVED" },
        },
      });
      if (existingName) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A route named "${data.name}" already exists for your company.`,
        });
      }

      const terminalIds = [
        data.originTerminalId,
        data.destTerminalId,
        ...data.waypoints.map((wp) => wp.terminalId),
      ];
      const owned = await ctx.prisma.companyLocation.findMany({
        where: {
          id: { in: [...new Set(terminalIds)] },
          companyId: ctx.companyId,
          isTerminal: true,
          isActive: true,
        },
        select: { id: true },
      });
      if (owned.length !== new Set(terminalIds).size) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more terminals are invalid, inactive, or do not belong to your company.",
        });
      }

      return ctx.prisma.route.create({
        data: {
          companyId: ctx.companyId,
          name: data.name.trim(),
          originTerminalId: data.originTerminalId,
          destTerminalId: data.destTerminalId,
          distanceKm: data.distanceKm ?? null,
          estimatedMinutes: data.estimatedDurationMin ?? null,
          status: data.status,
          waypoints: {
            // M13: normalize stopOrder to 1..N (sequential, no gaps). The
            // origin terminal is 0 and the destination is derived as
            // lastWaypointOrder + 1, so sequential waypoints can never collide.
            create: data.waypoints.map((wp, idx) => ({
              terminalId: wp.terminalId,
              stopOrder: idx + 1,
              arrivalOffsetMinutes: wp.offsetMinutes,
              departureOffsetMinutes: wp.offsetMinutes + (wp.dwellMinutes ?? 15),
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
      requirePermission(ctx, "routes:update");
      const existingRoute = await ctx.prisma.route.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!existingRoute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
      }

      const data = input.data;
      const newOrigin = data.originTerminalId ?? existingRoute.originTerminalId;
      const newDest = data.destTerminalId ?? existingRoute.destTerminalId;
      if (newOrigin === newDest) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Origin and destination terminals must be different.",
        });
      }

      // Guard: Route name must be unique per company
      if (data.name && data.name.trim() !== existingRoute.name) {
        const existingName = await ctx.prisma.route.findFirst({
          where: {
            companyId: ctx.companyId,
            name: data.name.trim(),
            id: { not: input.id },
            status: { not: "ARCHIVED" },
          },
        });
        if (existingName) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `A route named "${data.name.trim()}" already exists for your company.`,
          });
        }
      }

      // Guard: Reactivating a route requires all associated terminals to be active & bookable
      if (data.status === "ACTIVE" && existingRoute.status !== "ACTIVE") {
        const checkWaypoints = data.waypoints
          ? data.waypoints.map((w) => w.terminalId)
          : (
              await ctx.prisma.routeWaypoint.findMany({
                where: { routeId: input.id },
                select: { terminalId: true },
              })
            ).map((w) => w.terminalId);
        const requiredTermIds = [
          ...new Set([newOrigin, newDest, ...checkWaypoints]),
        ];
        const validTerms = await ctx.prisma.companyLocation.findMany({
          where: {
            id: { in: requiredTermIds },
            companyId: ctx.companyId,
            isActive: true,
            isTerminal: true,
          },
          select: { id: true, name: true },
        });
        if (validTerms.length !== requiredTermIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot activate route: One or more associated terminals are inactive or not configured as bookable passenger terminals.",
          });
        }
      }

      const terminalIds = [
        ...(data.originTerminalId ? [data.originTerminalId] : []),
        ...(data.destTerminalId ? [data.destTerminalId] : []),
        ...(data.waypoints?.map((wp) => wp.terminalId) ?? []),
      ];
      if (terminalIds.length > 0) {
        const owned = await ctx.prisma.companyLocation.findMany({
          where: {
            id: { in: [...new Set(terminalIds)] },
            companyId: ctx.companyId,
            isTerminal: true,
            isActive: true,
          },
          select: { id: true },
        });
        if (owned.length !== new Set(terminalIds).size) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more terminals are invalid, inactive, or do not belong to your company.",
          });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData["name"] = data.name.trim();
      if (data.originTerminalId !== undefined)
        updateData["originTerminalId"] = data.originTerminalId;
      if (data.destTerminalId !== undefined)
        updateData["destTerminalId"] = data.destTerminalId;
      if (data.distanceKm !== undefined) updateData["distanceKm"] = data.distanceKm;
      if (data.estimatedDurationMin !== undefined)
        updateData["estimatedMinutes"] = data.estimatedDurationMin;
      if (data.status !== undefined) updateData["status"] = data.status;

      let updatedRoute;
      if (data.waypoints) {
        updatedRoute = await ctx.prisma.$transaction(async (tx) => {
          await tx.routeWaypoint.deleteMany({ where: { routeId: input.id } });
          return tx.route.update({
            where: { id: input.id },
            data: {
              ...updateData,
              waypoints: {
                // M13: normalize stopOrder to 1..N (sequential, no gaps).
                create: data.waypoints!.map((wp, idx) => ({
                  terminalId: wp.terminalId,
                  stopOrder: idx + 1,
                  arrivalOffsetMinutes: wp.offsetMinutes,
                  departureOffsetMinutes: wp.offsetMinutes + (wp.dwellMinutes ?? 15),
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
          bookings: {
            some: { status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
          },
        },
      });

      // Cascade: suspending or archiving a route deactivates all its schedules so
      // no new trips are generated. Already-booked future trips are unaffected.
      let deactivatedSchedules = 0;
      if (data.status === "SUSPENDED" || data.status === "ARCHIVED") {
        const res = await ctx.prisma.schedule.updateMany({
          where: { routeId: input.id, isActive: true },
          data: { isActive: false },
        });
        deactivatedSchedules = res.count;
      }

      // Stale-fare check: when waypoints are fully replaced, fares whose toStopOrder
      // exceeds the new route length are now orphaned and will never be bookable.
      // After M13 normalization: waypoints → stopOrder 1..N, destination → N+1.
      let staleFareCount = 0;
      if (data.waypoints) {
        const newLastStopOrder =
          data.waypoints.length > 0 ? data.waypoints.length + 1 : 1;
        staleFareCount = await ctx.prisma.fare.count({
          where: {
            schedule: { routeId: input.id },
            isActive: true,
            toStopOrder: { gt: newLastStopOrder },
          },
        });
      }

      return {
        route: updatedRoute,
        needsReconciliation: futureTripsCount > 0,
        deactivatedSchedules,
        staleFareCount,
      };
    }),

  delete: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "routes:delete");
      const existingRoute = await ctx.prisma.route.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!existingRoute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
      }

      const confirmedBookingsCount = await ctx.prisma.booking.count({
        where: {
          trip: {
            schedule: { routeId: input.id },
            departureDate: { gte: new Date() },
          },
          status: "CONFIRMED",
        },
      });

      if (confirmedBookingsCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete: ${confirmedBookingsCount} confirmed booking(s) exist on upcoming trips using this route. Archive the route instead.`,
        });
      }

      const anyTripCount = await ctx.prisma.trip.count({
        where: { schedule: { routeId: input.id } },
      });

      if (anyTripCount > 0) {
        await ctx.prisma.$transaction([
          ctx.prisma.route.update({
            where: { id: input.id },
            data: { status: "ARCHIVED" },
          }),
          ctx.prisma.schedule.updateMany({
            where: { routeId: input.id },
            data: { isActive: false },
          }),
        ]);
        return { success: true, archived: true };
      }

      await ctx.prisma.route.delete({ where: { id: input.id } });
      return { success: true, archived: false };
    }),
});
