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
      where: {
        isActive: true,
        OR: [
          { companyId: null },
          { companyId: ctx.companyId },
        ],
      },
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

      // Validate busType exists and is active
      const busType = await ctx.prisma.busType.findUnique({
        where: { id: input.busTypeId, isActive: true },
      });
      if (!busType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bus type not found or inactive.",
        });
      }

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
            seatClass: input.seatClass ?? template.seatClass ?? "STANDARD",
            manufactureYear: input.manufactureYear ?? null,
            notes: input.notes ?? null,
            status: input.status ?? "ACTIVE",
          },
          include: {
            busType: true,
            layoutTemplate: true,
          },
        });

        // Generate Seat rows from the template's SeatTemplate relation.
        // isBookable is copied as an immutable flag — it never changes after creation.
        // isActive starts true for bookable positions, false for non-bookable ones.
        if (template.seatTemplates.length > 0) {
          const seatsData = template.seatTemplates.map((t) => ({
            busId: bus.id,
            row: t.row,
            col: t.col,
            deck: t.deck,
            label: t.label,
            seatType: t.seatType,
            isBookable: t.isBookable,
            isActive: t.isBookable,
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
          seatClass: z.enum(["ECONOMY", "STANDARD", "VIP"]).optional(),
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

      return ctx.prisma.$transaction(async (tx) => {
        const bus = await tx.bus.findFirst({
          where: { id: input.id, companyId: ctx.companyId, deletedAt: null },
        });

        if (!bus) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bus not found" });
        }

        if (input.data.status === "RETIRED" && bus.status !== "RETIRED") {
          const activeTrip = await tx.trip.findFirst({
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

        // §2.2 FIX: Disassociate preferred bus from schedules inside the same
        // transaction as the bus update, so they succeed or fail atomically.
        let warning: string | undefined;
        if (input.data.status && input.data.status !== "ACTIVE") {
          const schedulesCount = await tx.schedule.count({
            where: { preferredBusId: bus.id, companyId: ctx.companyId },
          });
          if (schedulesCount > 0) {
            await tx.schedule.updateMany({
              where: { preferredBusId: bus.id, companyId: ctx.companyId },
              data: { preferredBusId: null },
            });
            warning = `This bus was the preferred vehicle for ${schedulesCount} schedule(s). Those schedules now have no preferred bus and will stop generating trips.`;
          }
        }

        // exactOptionalPropertyTypes compliance: strip undefined
        const updateData = Object.fromEntries(
          Object.entries(input.data).filter(([, v]) => v !== undefined),
        ) as Parameters<typeof tx.bus.update>[0]["data"];

        const updatedBus = await tx.bus.update({
          where: { id: input.id },
          data: updateData,
          include: {
            busType: true,
            layoutTemplate: true,
          },
        });

        return { ...updatedBus, warning };
      });
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

      // §2.1 FIX: Do NOT rename registrationPlate on soft-delete — it corrupts
      // audit logs and breaks historical plate lookups. The `deletedAt` timestamp
      // is sufficient to logically remove the record; the unique constraint is
      // handled by the compound index (registrationPlate, deletedAt IS NULL).
      await ctx.prisma.bus.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
          status: "RETIRED",
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

      // §4.2 FIX: Perform the booking check INSIDE the transaction to eliminate
      // the race window between the check and the seat status update.
      return ctx.prisma.$transaction(async (tx) => {
        const bus = await tx.bus.findFirst({
          where: { id: input.busId, companyId: ctx.companyId, deletedAt: null },
        });
        if (!bus) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bus not found" });
        }

        const seat = await tx.seat.findFirst({
          where: { id: input.seatId, busId: input.busId },
        });
        if (!seat) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Seat not found" });
        }

        const futureTrips = await tx.trip.findMany({
          where: { busId: input.busId, status: { in: ["SCHEDULED", "BOARDING", "DELAYED"] } },
          select: { id: true },
        });
        const futureTripIds = futureTrips.map((t) => t.id);

        if (futureTripIds.length > 0 && !input.isActive) {
          const bookedTrips = await tx.booking.findMany({
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
              message:
                "Cannot disable seat: It is actively booked on an upcoming/boarding trip. Reassign the passenger first.",
            });
          }
        }

        const updatedSeat = await tx.seat.update({
          where: { id: input.seatId },
          data: { isActive: input.isActive },
        });

        if (futureTripIds.length > 0) {
          await tx.tripSeat.updateMany({
            where: {
              seatId: input.seatId,
              tripId: { in: futureTripIds },
            },
            data: { isActive: input.isActive },
          });

          // Sync Trip.totalSeats for all future trips
          for (const tripId of futureTripIds) {
            const count = await tx.tripSeat.count({
              where: {
                tripId,
                isActive: true,
                seat: { isBookable: true },
              },
            });
            await tx.trip.update({
              where: { id: tripId },
              data: { totalSeats: count },
            });
          }
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
          s.isBookable &&
          s.seatType !== "DRIVER_AREA" &&
          s.seatType !== "EMPTY_SPACE",
      ).length;

      if (totalSeats === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Layout must have at least one passenger seat.",
        });
      }

      // Validate bus type is accessible
      const busType = await ctx.prisma.busType.findFirst({
        where: {
          id: input.busTypeId,
          isActive: true,
          OR: [
            { companyId: null },
            { companyId: ctx.companyId },
          ],
        },
      });
      if (!busType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Selected bus type is not found or inactive.",
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

      // §4.1 FIX: Only count ACTIVE (non-soft-deleted) buses. Without the
      // `deletedAt: null` filter, soft-deleted buses permanently block layout
      // deletion even after being retired.
      return ctx.prisma.$transaction(async (tx) => {
        const busCount = await tx.bus.count({
          where: { layoutTemplateId: input.id, companyId: ctx.companyId, deletedAt: null },
        });
        if (busCount > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Cannot delete — ${busCount} active bus${busCount > 1 ? "es" : ""} use this layout. Reassign or retire those buses first.`,
          });
        }

        await tx.seatLayoutTemplate.delete({ where: { id: input.id } });
        return { success: true };
      });
    }),

  // ── Custom Bus Type Mutations ──────────────────────────────────────────

  createBusType: operatorCompanyProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(60),
        description: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "fleet:create");

      // Guard: no duplicate name across platform or own types
      const existing = await ctx.prisma.busType.findFirst({
        where: {
          name: input.name,
          OR: [
            { companyId: null },
            { companyId: ctx.companyId },
          ],
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            existing.companyId === null
              ? `"${input.name}" is a platform bus type and cannot be recreated.`
              : `A custom bus type named "${input.name}" already exists.`,
        });
      }

      return ctx.prisma.busType.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          companyId: ctx.companyId,
          isActive: true,
        },
      });
    }),

  deleteBusType: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "fleet:delete");

      return ctx.prisma.$transaction(async (tx) => {
        const busType = await tx.busType.findFirst({
          where: { id: input.id, companyId: ctx.companyId },
        });
        if (!busType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Bus type not found or not owned by your company.",
          });
        }

        const busCount = await tx.bus.count({
          where: { busTypeId: input.id, companyId: ctx.companyId, deletedAt: null },
        });
        if (busCount > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Cannot delete — ${busCount} bus${busCount > 1 ? "es" : ""} use "${busType.name}". Reassign or retire those vehicles first.`,
          });
        }

        const layoutCount = await tx.seatLayoutTemplate.count({
          where: { busTypeId: input.id, companyId: ctx.companyId },
        });
        if (layoutCount > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Cannot delete — ${layoutCount} layout${layoutCount > 1 ? "s" : ""} reference "${busType.name}". Delete those layouts first.`,
          });
        }

        await tx.busType.delete({ where: { id: input.id } });
        return { success: true };
      });
    }),
});
