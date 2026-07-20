import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";
import {
  requirePermission,
  operatorHasPermission,
} from "@/lib/permissions/authorize";
import { createBusSchema } from "@moja/schemas";

export const fleetRouter = createTRPCRouter({
  getBusTypes: operatorCompanyProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "fleet:read");
    return ctx.prisma.busType.findMany({
      where: { isActive: true },
    });
  }),

  getPermissions: operatorCompanyProcedure.query(({ ctx }) => {
    return {
      canManageFleet:
        operatorHasPermission(ctx, "fleet:create") ||
        operatorHasPermission(ctx, "fleet:update"),
    };
  }),

  // Platform defaults + calling company's custom layouts
  getLayoutTemplates: operatorCompanyProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "fleet:read");
    return ctx.prisma.seatLayoutTemplate.findMany({
      where: {
        OR: [{ companyId: null }, { companyId: ctx.companyId }],
      },
      include: {
        busType: true,
        seatTemplates: {
          orderBy: [{ row: "asc" }, { col: "asc" }],
        },
      },
      orderBy: [{ companyId: "asc" }, { name: "asc" }], // nulls (platform) first
    });
  }),

  // Company-owned custom layouts only, with bus-use count
  getCustomLayouts: operatorCompanyProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "fleet:read");
    return ctx.prisma.seatLayoutTemplate.findMany({
      where: { companyId: ctx.companyId },
      include: {
        busType: true,
        seatTemplates: {
          orderBy: [{ row: "asc" }, { col: "asc" }],
        },
        _count: { select: { buses: true } },
      },
      orderBy: { name: "asc" },
    });
  }),

  getBuses: operatorCompanyProcedure
    .input(z.object({ slim: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "fleet:read");
      const slim = input?.slim ?? false;
      const buses = await ctx.prisma.bus.findMany({
        where: { companyId: ctx.companyId, deletedAt: null },
        include: {
          busType: true,
          // Always include layoutTemplate so the return type is uniform across
          // the slim/non-slim branches (a conditional include would create a
          // union type where the slim member lacks `layoutTemplate`, breaking
          // consumers that read the seat layout). `_count` stays slim-only.
          layoutTemplate: true,
          ...(slim ? {} : { _count: { select: { seats: true } } }),
        },
        orderBy: { createdAt: "desc" },
      });

      const stats = {
        total: buses.length,
        active: buses.filter((b) => b.status === "ACTIVE").length,
        maintenance: buses.filter((b) => b.status === "MAINTENANCE").length,
        inactive: buses.filter((b) => b.status === "INACTIVE").length,
        retired: buses.filter((b) => b.status === "RETIRED").length,
        totalSeats: buses.reduce(
          (sum, b) => sum + (b.layoutTemplate?.totalSeats ?? 0),
          0,
        ),
      };

      return { buses, stats };
    }),

  getBusDetails: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "fleet:read");
      const bus = await ctx.prisma.bus.findFirst({
        where: { id: input.id, companyId: ctx.companyId, deletedAt: null },
        include: {
          busType: true,
          layoutTemplate: true,
          seats: {
            orderBy: [{ deck: "asc" }, { row: "asc" }, { col: "asc" }],
          },
        },
      });
      if (!bus) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bus not found" });
      }
      return bus;
    }),

  createBus: operatorCompanyProcedure
    .input(createBusSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "fleet:create");
      // Check if registration plate exists
      const existing = await ctx.prisma.bus.findFirst({
        where: {
          registrationPlate: input.registrationPlate,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This registration plate is already registered to a vehicle in the system. If this is an error, please contact support.",
        });
      }

      // Fetch template with its seat definitions to auto-generate seats
      const template = await ctx.prisma.seatLayoutTemplate.findFirst({
        where: {
          id: input.layoutTemplateId,
          OR: [{ companyId: null }, { companyId: ctx.companyId }],
        },
        include: { seatTemplates: true },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Layout template not found",
        });
      }

      if (template.busTypeId !== input.busTypeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected layout does not match the chosen bus type.",
        });
      }

      // Use a transaction to create bus and its seats based on template
      return ctx.prisma.$transaction(async (tx) => {
        const bus = await tx.bus.create({
          data: {
            companyId: ctx.companyId,
            registrationPlate: input.registrationPlate,
            internalName: input.internalName ?? null,
            busTypeId: template.busTypeId,
            layoutTemplateId: input.layoutTemplateId,
            manufactureYear: input.manufactureYear ?? null,
            notes: input.notes ?? null,
            status: input.status ?? "ACTIVE",
          },
          include: {
            busType: true,
            layoutTemplate: true,
          },
        });

        // Generate Seat rows from the template's SeatTemplate relation
        if (template.seatTemplates.length > 0) {
          const seatsData = template.seatTemplates.map((t) => ({
            busId: bus.id,
            row: t.row,
            col: t.col,
            deck: t.deck,
            label: t.label,
            seatType: t.seatType,
            isActive: true,
          }));

          await tx.seat.createMany({
            data: seatsData,
          });
        }

        return bus;
      });
    }),

  updateBus: operatorCompanyProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          registrationPlate: z.string().optional(),
          internalName: z.string().nullable().optional(),
          manufactureYear: z.number().int().nullable().optional(),
          notes: z.string().nullable().optional(),
          status: z
            .enum(["ACTIVE", "MAINTENANCE", "INACTIVE", "RETIRED"])
            .optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "fleet:update");
      const bus = await ctx.prisma.bus.findFirst({
        where: { id: input.id, companyId: ctx.companyId, deletedAt: null },
      });

      if (!bus) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bus not found" });
      }

      if (input.data.status === "RETIRED" && bus.status !== "RETIRED") {
        const activeTrip = await ctx.prisma.trip.findFirst({
          where: {
            busId: bus.id,
            status: { in: ["SCHEDULED", "BOARDING"] },
          },
        });
        if (activeTrip) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot retire a vehicle that is assigned to an active trip.",
          });
        }
      }

      // exactOptionalPropertyTypes compliance: strip undefined
      const updateData = Object.fromEntries(
        Object.entries(input.data).filter(([, v]) => v !== undefined),
      ) as Parameters<typeof ctx.prisma.bus.update>[0]["data"];

      let warning: string | undefined;

      if (input.data.status && input.data.status !== "ACTIVE") {
        const schedulesCount = await ctx.prisma.schedule.count({
          where: { preferredBusId: bus.id, companyId: ctx.companyId }
        });
        
        if (schedulesCount > 0) {
          await ctx.prisma.schedule.updateMany({
            where: { preferredBusId: bus.id, companyId: ctx.companyId },
            data: { preferredBusId: null },
          });
          warning = `This bus was the preferred vehicle for ${schedulesCount} schedule(s). Those schedules now have no preferred bus and will stop generating trips.`;
        }
      }

      const updatedBus = await ctx.prisma.bus.update({
        where: { id: input.id },
        data: updateData,
        include: {
          busType: true,
          layoutTemplate: true,
        },
      });

      return {
        ...updatedBus,
        warning
      };
    }),

  deleteBus: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "fleet:delete");
      const bus = await ctx.prisma.bus.findFirst({
        where: { id: input.id, companyId: ctx.companyId, deletedAt: null },
      });

      if (!bus) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bus not found" });
      }

      const now = new Date();
      const futureTrip = await ctx.prisma.trip.findFirst({
        where: {
          busId: input.id,
          companyId: ctx.companyId,
          departureDate: { gte: now },
          status: { notIn: ["CANCELLED", "ARRIVED"] },
        },
        select: { id: true },
      });

      if (futureTrip) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Cannot delete this bus because it is assigned to upcoming trips.",
        });
      }

      const activeBooking = await ctx.prisma.booking.findFirst({
        where: {
          trip: { busId: input.id, companyId: ctx.companyId },
          status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
        },
        select: { id: true },
      });

      if (activeBooking) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Cannot delete this bus because it has active or upcoming bookings.",
        });
      }

      await ctx.prisma.bus.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
          status: "RETIRED",
          registrationPlate: `DELETED_${Date.now()}_${bus.registrationPlate}`,
        },
      });

      return { success: true };
    }),

  toggleSeatStatus: operatorCompanyProcedure
    .input(
      z.object({
        busId: z.string(),
        seatId: z.string(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "fleet:update");
      // First verify the bus belongs to the company
      const bus = await ctx.prisma.bus.findFirst({
        where: { id: input.busId, companyId: ctx.companyId, deletedAt: null },
      });

      if (!bus) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bus not found" });
      }

      const seat = await ctx.prisma.seat.findFirst({
        where: { id: input.seatId, busId: input.busId },
      });

      if (!seat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Seat not found" });
      }

      const futureTrips = await ctx.prisma.trip.findMany({
        where: { busId: input.busId, status: { in: ["SCHEDULED", "BOARDING", "DELAYED"] } },
        select: { id: true },
      });
      const futureTripIds = futureTrips.map((t) => t.id);

      let unbookedTripIds = futureTripIds;
      if (futureTripIds.length > 0 && !input.isActive) {
        const bookedTrips = await ctx.prisma.booking.findMany({
          where: {
            seatId: input.seatId,
            tripId: { in: futureTripIds },
            status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
          },
          select: { tripId: true },
        });

        if (bookedTrips.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot disable seat: It is actively booked on an upcoming/boarding trip. Reassign the passenger first.",
          });
        }
      }

      return ctx.prisma.$transaction(async (tx) => {
        const updatedSeat = await tx.seat.update({
          where: { id: input.seatId },
          data: { isActive: input.isActive },
        });

        if (unbookedTripIds.length > 0) {
          await tx.tripSeat.updateMany({
            where: {
              seatId: input.seatId,
              tripId: { in: unbookedTripIds },
            },
            data: { isActive: input.isActive },
          });
        }
        
        return updatedSeat;
      });
    }),

  // ── Custom Layout Mutations ──────────────────────────────────────────────

  createCustomLayout: operatorCompanyProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(60),
        busTypeId: z.string().min(1, "Bus type is required"),
        rows: z.number().int().min(2).max(20),
        columns: z.number().int().min(2).max(6),
        hasAC: z.boolean().default(false),
        hasWifi: z.boolean().default(false),
        hasToilet: z.boolean().default(false),
        hasLuggage: z.boolean().default(true),
        seats: z.array(
          z.object({
            row: z.number().int().min(1),
            col: z.number().int().min(1),
            deck: z.number().int().min(1).default(1),
            label: z.string(),
            seatType: z.enum([
              "PASSENGER_WINDOW",
              "PASSENGER_AISLE",
              "PASSENGER_MIDDLE",
              "DRIVER_AREA",
              "EMPTY_SPACE",
            ]),
            isBookable: z.boolean(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "fleet:create");
      // Guard: no duplicate name per company
      const existing = await ctx.prisma.seatLayoutTemplate.findFirst({
        where: { name: input.name, companyId: ctx.companyId },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A layout with this name already exists.",
        });
      }

      const totalSeats = input.seats.filter(
        (s) =>
          s.seatType === "PASSENGER_WINDOW" ||
          s.seatType === "PASSENGER_AISLE" ||
          s.seatType === "PASSENGER_MIDDLE",
      ).length;

      if (totalSeats === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Layout must have at least one passenger seat.",
        });
      }

      return ctx.prisma.seatLayoutTemplate.create({
        data: {
          companyId: ctx.companyId,
          busTypeId: input.busTypeId,
          name: input.name,
          totalSeats,
          rows: input.rows,
          columns: input.columns,
          hasAC: input.hasAC,
          hasWifi: input.hasWifi,
          hasToilet: input.hasToilet,
          hasLuggage: input.hasLuggage,
          seatTemplates: { create: input.seats },
        },
        include: { busType: true },
      });
    }),

  deleteCustomLayout: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "fleet:delete");
      const layout = await ctx.prisma.seatLayoutTemplate.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!layout) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Layout not found or not owned by your company.",
        });
      }

      // Block deletion if any bus references this layout
      const busCount = await ctx.prisma.bus.count({
        where: { layoutTemplateId: input.id, companyId: ctx.companyId },
      });
      if (busCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Cannot delete — ${busCount} bus${busCount > 1 ? "es" : ""} use this layout. Reassign or remove those buses first.`,
        });
      }

      await ctx.prisma.seatLayoutTemplate.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
