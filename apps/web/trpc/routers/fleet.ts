import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";

export const fleetRouter = createTRPCRouter({
  getBusTypes: operatorCompanyProcedure.query(async ({ ctx }) => {
    return ctx.prisma.busType.findMany({
      where: { isActive: true },
    });
  }),

  getLayoutTemplates: operatorCompanyProcedure.query(async ({ ctx }) => {
    return ctx.prisma.seatLayoutTemplate.findMany({
      include: { busType: true },
    });
  }),

  getBuses: operatorCompanyProcedure.query(async ({ ctx }) => {
    const buses = await ctx.prisma.bus.findMany({
      where: { companyId: ctx.companyId },
      include: {
        busType: true,
        layoutTemplate: true,
        _count: { select: { seats: true } },
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
      const bus = await ctx.prisma.bus.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
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
    .input(
      z.object({
        registrationPlate: z.string().min(1, "Registration plate is required"),
        busTypeId: z.string(),
        layoutTemplateId: z.string(),
        internalName: z.string().optional(),
        manufactureYear: z.number().int().min(1900).optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if registration plate exists
      const existing = await ctx.prisma.bus.findFirst({
        where: {
          registrationPlate: input.registrationPlate,
          companyId: ctx.companyId,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Bus with this registration plate already exists",
        });
      }

      // Fetch template with its seat definitions to auto-generate seats
      const template = await ctx.prisma.seatLayoutTemplate.findUnique({
        where: { id: input.layoutTemplateId },
        include: { seatTemplates: true },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Layout template not found",
        });
      }

      // Use a transaction to create bus and its seats based on template
      return ctx.prisma.$transaction(async (tx) => {
        const bus = await tx.bus.create({
          data: {
            companyId: ctx.companyId,
            registrationPlate: input.registrationPlate,
            internalName: input.internalName ?? null,
            busTypeId: input.busTypeId,
            layoutTemplateId: input.layoutTemplateId,
            manufactureYear: input.manufactureYear ?? null,
            notes: input.notes ?? null,
            status: "ACTIVE",
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
          internalName: z.string().optional(),
          manufactureYear: z.number().int().optional(),
          notes: z.string().optional(),
          status: z
            .enum(["ACTIVE", "MAINTENANCE", "INACTIVE", "RETIRED"])
            .optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const bus = await ctx.prisma.bus.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!bus) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bus not found" });
      }

      // exactOptionalPropertyTypes compliance: strip undefined
      const updateData = Object.fromEntries(
        Object.entries(input.data).filter(([, v]) => v !== undefined),
      ) as Parameters<typeof ctx.prisma.bus.update>[0]["data"];

      return ctx.prisma.bus.update({
        where: { id: input.id },
        data: updateData,
        include: {
          busType: true,
          layoutTemplate: true,
        },
      });
    }),

  deleteBus: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bus = await ctx.prisma.bus.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
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

      await ctx.prisma.bus.delete({
        where: { id: input.id },
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
      // First verify the bus belongs to the company
      const bus = await ctx.prisma.bus.findFirst({
        where: { id: input.busId, companyId: ctx.companyId },
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
        where: { busId: input.busId, status: "SCHEDULED" },
        select: { id: true },
      });
      const futureTripIds = futureTrips.map((t) => t.id);

      let unbookedTripIds = futureTripIds;
      if (futureTripIds.length > 0) {
        const bookedTrips = await ctx.prisma.booking.findMany({
          where: {
            seatId: input.seatId,
            tripId: { in: futureTripIds },
            status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
          },
          select: { tripId: true },
        });
        const bookedTripIds = bookedTrips.map((b) => b.tripId);
        unbookedTripIds = futureTripIds.filter((id) => !bookedTripIds.includes(id));
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
});
