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
    .input(z.object({ id: z.string().uuid() }))
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
        busTypeId: z.string().uuid(),
        layoutTemplateId: z.string().uuid(),
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

      // Fetch template to auto-generate seats
      const template = await ctx.prisma.seatLayoutTemplate.findUnique({
        where: { id: input.layoutTemplateId },
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

        // Parse layout grid to create seats
        const layoutGrid = (template as any).layoutGrid as {
          type: any;
          row: number;
          col: number;
          label: string;
          deck: number;
        }[];

        if (Array.isArray(layoutGrid) && layoutGrid.length > 0) {
          const seatsData = layoutGrid
            .filter(
              (cell) =>
                cell.type !== "EMPTY_SPACE" && cell.type !== "DRIVER_AREA",
            )
            .map((cell) => ({
              busId: bus.id,
              row: cell.row,
              col: cell.col,
              deck: cell.deck ?? 1,
              label: cell.label,
              seatType: cell.type,
              isActive: true,
            }));

          if (seatsData.length > 0) {
            await tx.seat.createMany({
              data: seatsData,
            });
          }
        }

        return bus;
      });
    }),

  updateBus: operatorCompanyProcedure
    .input(
      z.object({
        id: z.string().uuid(),
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
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const bus = await ctx.prisma.bus.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!bus) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bus not found" });
      }

      await ctx.prisma.bus.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  toggleSeatStatus: operatorCompanyProcedure
    .input(
      z.object({
        busId: z.string().uuid(),
        seatId: z.string().uuid(),
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

      return ctx.prisma.seat.update({
        where: { id: input.seatId },
        data: { isActive: input.isActive },
      });
    }),
});
