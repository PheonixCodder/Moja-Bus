import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";
import { requirePermission } from "@/lib/permissions/authorize";
import { createTerminalSchema, updateTerminalSchema } from "@moja/schemas";

export const terminalsRouter = createTRPCRouter({
  list: operatorCompanyProcedure
    .input(
      z
        .object({
          bookableOnly: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "terminals:read");
      return ctx.prisma.companyLocation.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.bookableOnly ? { isTerminal: true, isActive: true } : {}),
        },
        include: {
          cityRelation: true,
        },
        orderBy: { name: "asc" },
      });
    }),

  create: operatorCompanyProcedure
    .input(createTerminalSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "terminals:create");
      const data = input;

      return ctx.prisma.$transaction(async (tx) => {
        if (data.isPrimary === true) {
          await tx.companyLocation.updateMany({
            where: { companyId: ctx.companyId, isPrimary: true },
            data: { isPrimary: false },
          });
        }

        return tx.companyLocation.create({
          data: {
            companyId: ctx.companyId,
            name: data.name,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2 ?? null,
            city: data.city ?? null,
            state: data.state ?? null,
            postalCode: data.postalCode ?? null,
            country: data.country,
            cityId: data.cityId ?? null,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            phone: data.phone,
            managerName: data.managerName ?? null,
            managerPhone: data.managerPhone ?? null,
            managerEmail: data.managerEmail ?? null,
            isPrimary: data.isPrimary,
            isTerminal: data.isTerminal,
            isActive: data.isActive,
            operatingHours: data.operatingHours ?? null,
          },
          include: {
            cityRelation: true,
          },
        });
      });
    }),

  update: operatorCompanyProcedure
    .input(z.object({ id: z.string(), data: updateTerminalSchema }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "terminals:update");

      return ctx.prisma.$transaction(async (tx) => {
        const existingLocation = await tx.companyLocation.findFirst({
          where: { id: input.id, companyId: ctx.companyId },
        });

        if (!existingLocation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Location not found",
          });
        }

        const data = input.data;

        const isDeactivating = data.isActive === false && existingLocation.isActive;
        const isDemoting = data.isTerminal === false && existingLocation.isTerminal;

        if (isDeactivating || isDemoting) {
          const [linkedRoute, waypoint] = await Promise.all([
            tx.route.findFirst({
              where: {
                companyId: ctx.companyId,
                status: { not: "ARCHIVED" },
                OR: [
                  { originTerminalId: input.id },
                  { destTerminalId: input.id },
                ],
              },
              select: { id: true, name: true },
            }),
            tx.routeWaypoint.findFirst({
              where: {
                terminalId: input.id,
                route: { companyId: ctx.companyId, status: { not: "ARCHIVED" } },
              },
              select: { id: true },
            }),
          ]);
          if (linkedRoute || waypoint) {
            const actionVerb = isDemoting
              ? "demote this terminal to a non-terminal depot"
              : "deactivate this terminal";
            throw new TRPCError({
              code: "CONFLICT",
              message: linkedRoute
                ? `Cannot ${actionVerb} because it is used by route "${linkedRoute.name}".`
                : `Cannot ${actionVerb} because it is used as a route waypoint.`,
            });
          }
        }

        if (data.isPrimary === true && !existingLocation.isPrimary) {
          await tx.companyLocation.updateMany({
            where: { companyId: ctx.companyId, isPrimary: true },
            data: { isPrimary: false },
          });
        }

        const updatePayload = Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== undefined),
        ) as Parameters<typeof tx.companyLocation.update>[0]["data"];

        return tx.companyLocation.update({
          where: { id: input.id },
          data: updatePayload,
          include: { cityRelation: true },
        });
      });
    }),

  delete: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "terminals:delete");

      return ctx.prisma.$transaction(async (tx) => {
        const existingLocation = await tx.companyLocation.findFirst({
          where: { id: input.id, companyId: ctx.companyId },
        });

        if (!existingLocation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Location not found",
          });
        }

        const [linkedRoute, waypoint, tripStop] = await Promise.all([
          tx.route.findFirst({
            where: {
              companyId: ctx.companyId,
              OR: [
                { originTerminalId: input.id },
                { destTerminalId: input.id },
              ],
            },
            select: { id: true, name: true },
          }),
          tx.routeWaypoint.findFirst({
            where: { terminalId: input.id },
            select: { id: true },
          }),
          tx.tripStop.findFirst({
            where: { terminalId: input.id },
            select: { id: true },
          }),
        ]);

        if (linkedRoute) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Cannot delete this terminal because it is used by route "${linkedRoute.name}".`,
          });
        }

        if (waypoint || tripStop) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Cannot delete this terminal because it is referenced by routes or scheduled trips.",
          });
        }

        await tx.companyLocation.delete({
          where: { id: input.id },
        });

        return { success: true };
      });
    }),
});
