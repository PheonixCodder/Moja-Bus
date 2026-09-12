import type { Prisma } from "@moja/db";
import { createTerminalSchema, updateTerminalSchema } from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { stringifyCsv } from "@/lib/csv/parser";
import { TERMINALS_CSV_TEMPLATE } from "@/lib/csv/templates";
import { requirePermission } from "@/lib/permissions/authorize";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";

// Phase 0 (first-class urban): terminals must be geo-complete. When a terminal
// is created/updated without a municipality, auto-assign the city's single
// pass-through municipality; otherwise a terminal without a city is unusable
// in search and routes cannot be classified.
async function ensureTerminalGeography(
  prisma: Prisma.TransactionClient,
  cityId: string | null | undefined,
  municipalityId: string | null | undefined,
) {
  if (!cityId) return { municipalityId: undefined };
  if (municipalityId) return { municipalityId };

  const munis = await prisma.municipality.findMany({
    where: { cityId, isActive: true },
    select: { id: true },
  });
  if (munis.length === 1) {
    return { municipalityId: munis[0]?.id };
  }
  return { municipalityId: undefined };
}

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
          municipality: true,
          quarter: true,
          captures: {
            where: {
              status: { in: ["OPEN", "PENDING_CONFIRMATION", "CONFIRMED"] },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
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

        // Phase 0: auto-assign the city's single (pass-through) municipality
        const geo = await ensureTerminalGeography(
          tx,
          data.cityId,
          data.municipalityId,
        );

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
            municipalityId: geo.municipalityId ?? data.municipalityId ?? null,
            quarterId: data.quarterId ?? null,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            phone: data.phone,
            managerName: data.managerName ?? null,
            managerPhone: data.managerPhone ?? null,
            managerEmail: data.managerEmail ?? null,
            isPrimary: data.isPrimary,
            isTerminal: data.isTerminal,
            isActive: data.isActive,
            geoCaptureStatus: data.geoCaptureStatus ?? "COMPLETE",
            operatingHours: data.operatingHours ?? null,
          },
          include: {
            cityRelation: true,
            municipality: true,
            quarter: true,
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

        const isDeactivating =
          data.isActive === false && existingLocation.isActive;
        const isDemoting =
          data.isTerminal === false && existingLocation.isTerminal;

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
                route: {
                  companyId: ctx.companyId,
                  status: { not: "ARCHIVED" },
                },
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

        // Phase 0: a passenger terminal must always have a city relation.
        // Block promotion/edits that would leave a geo-complete terminal
        // without a city. Terminals in the capture lifecycle (geoCaptureStatus
        // ≠ COMPLETE) are geo-incomplete by design until a capture is approved.
        const isOrBecomingTerminal =
          data.isTerminal === true || existingLocation.isTerminal;
        const effectiveCityId =
          data.cityId !== undefined ? data.cityId : existingLocation.cityId;
        const geoComplete =
          (data.geoCaptureStatus ?? existingLocation.geoCaptureStatus) ===
          "COMPLETE";
        if (isOrBecomingTerminal && !effectiveCityId && geoComplete) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "A passenger terminal must have a city assigned. Select a city before marking this location as a terminal.",
          });
        }

        // Phase 0: auto-assign the city's single (pass-through) municipality
        const geo = await ensureTerminalGeography(
          tx,
          effectiveCityId,
          data.municipalityId !== undefined
            ? data.municipalityId
            : existingLocation.municipalityId,
        );

        const updatePayload = Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== undefined),
        ) as Parameters<typeof tx.companyLocation.update>[0]["data"];
        if (
          geo.municipalityId !== undefined &&
          data.municipalityId === undefined
        ) {
          updatePayload.municipalityId = geo.municipalityId;
        }

        return tx.companyLocation.update({
          where: { id: input.id },
          data: updatePayload,
          include: { cityRelation: true, municipality: true, quarter: true },
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

  exportCsv: operatorCompanyProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "terminals:read");

    const locations = await ctx.prisma.companyLocation.findMany({
      where: { companyId: ctx.companyId },
      include: { cityRelation: true },
      orderBy: { name: "asc" },
    });

    const headers = TERMINALS_CSV_TEMPLATE.columns.map((c) => c.label);
    const rows = locations.map((loc) => [
      loc.name,
      loc.cityRelation?.name ?? loc.city ?? "",
      loc.addressLine1,
      loc.phone,
      loc.isTerminal ? "TRUE" : "FALSE",
      loc.managerName ?? "",
      loc.managerPhone ?? "",
      loc.latitude ?? "",
      loc.longitude ?? "",
    ]);

    const csv = stringifyCsv(headers, rows);
    const dateStr = new Date().toISOString().slice(0, 10);
    return {
      filename: `terminals-${dateStr}.csv`,
      csv,
      count: locations.length,
    };
  }),

  batchImport: operatorCompanyProcedure
    .input(
      z.object({
        upsert: z.boolean().default(false),
        records: z.array(
          z.object({
            name: z.string().min(1, "Name is required"),
            city: z.string().min(1, "City is required"),
            addressLine1: z.string().min(1, "Address is required"),
            phone: z.string().min(1, "Phone is required"),
            isTerminal: z.boolean().optional().default(true),
            managerName: z.string().optional().nullable(),
            managerPhone: z.string().optional().nullable(),
            latitude: z.number().optional().nullable(),
            longitude: z.number().optional().nullable(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "terminals:create");

      return ctx.prisma.$transaction(async (tx) => {
        const [cities, existingLocations] = await Promise.all([
          tx.city.findMany({ where: { isActive: true } }),
          tx.companyLocation.findMany({
            where: { companyId: ctx.companyId },
          }),
        ]);

        const existingByName = new Map(
          existingLocations.map((l) => [l.name.toLowerCase().trim(), l]),
        );

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const errors: Array<{ row: number; reason: string }> = [];

        for (let i = 0; i < input.records.length; i++) {
          const rec = input.records[i];
          if (!rec) continue;

          const cleanName = rec.name.trim();
          const cleanCity = rec.city.trim().toLowerCase();

          // Match city
          const matchedCity = cities.find(
            (c) =>
              c.name.toLowerCase() === cleanCity ||
              (c.nameEn && c.nameEn.toLowerCase() === cleanCity),
          );
          const cityId = matchedCity?.id ?? null;

          // Resolve municipality
          const geo = await ensureTerminalGeography(tx, cityId, undefined);

          const existing = existingByName.get(cleanName.toLowerCase());

          if (existing) {
            if (input.upsert) {
              await tx.companyLocation.update({
                where: { id: existing.id },
                data: {
                  addressLine1: rec.addressLine1.trim(),
                  city: matchedCity ? null : rec.city.trim(),
                  cityId: cityId ?? existing.cityId,
                  municipalityId: geo.municipalityId ?? existing.municipalityId,
                  phone: rec.phone.trim(),
                  isTerminal: rec.isTerminal ?? existing.isTerminal,
                  managerName: rec.managerName?.trim() ?? existing.managerName,
                  managerPhone:
                    rec.managerPhone?.trim() ?? existing.managerPhone,
                  latitude: rec.latitude ?? existing.latitude,
                  longitude: rec.longitude ?? existing.longitude,
                },
              });
              updatedCount++;
            } else {
              skippedCount++;
            }
          } else {
            await tx.companyLocation.create({
              data: {
                companyId: ctx.companyId,
                name: cleanName,
                addressLine1: rec.addressLine1.trim(),
                city: matchedCity ? null : rec.city.trim(),
                cityId,
                municipalityId: geo.municipalityId ?? null,
                phone: rec.phone.trim(),
                isTerminal: rec.isTerminal ?? true,
                managerName: rec.managerName?.trim() ?? null,
                managerPhone: rec.managerPhone?.trim() ?? null,
                latitude: rec.latitude ?? null,
                longitude: rec.longitude ?? null,
                geoCaptureStatus: "COMPLETE",
                country: "Cote d'Ivoire",
              },
            });
            createdCount++;
          }
        }

        return {
          totalRows: input.records.length,
          validRows: createdCount + updatedCount,
          invalidRows: errors.length,
          createdCount,
          updatedCount,
          skippedCount,
          errors,
        };
      });
    }),
});
