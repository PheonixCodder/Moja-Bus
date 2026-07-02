import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";

export const terminalsRouter = createTRPCRouter({
  list: operatorCompanyProcedure.query(async ({ ctx }) => {
    return ctx.prisma.companyLocation.findMany({
      where: {
        companyId: ctx.companyId,
      },
      include: {
        cityRelation: true,
      },
      orderBy: { name: "asc" },
    });
  }),

  create: operatorCompanyProcedure
    .input(z.any())
    .mutation(async ({ ctx, input }) => {
      const { createTerminalSchema } = await import("@moja/schemas");
      const parsed = createTerminalSchema.safeParse(input);

      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: parsed.error,
        });
      }

      const data = parsed.data;

      // Handle isPrimary constraint
      if (data.isPrimary === true) {
        await ctx.prisma.companyLocation.updateMany({
          where: { companyId: ctx.companyId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return ctx.prisma.companyLocation.create({
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
        },
        include: {
          cityRelation: true,
        },
      });
    }),

  update: operatorCompanyProcedure
    .input(z.object({ id: z.string().uuid(), data: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const { updateTerminalSchema } = await import("@moja/schemas");
      const parsed = updateTerminalSchema.safeParse(input.data);

      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: parsed.error,
        });
      }

      const existingLocation = await ctx.prisma.companyLocation.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!existingLocation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Location not found",
        });
      }

      const data = parsed.data;

      if (data.isPrimary === true && !existingLocation.isPrimary) {
        await ctx.prisma.companyLocation.updateMany({
          where: { companyId: ctx.companyId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Strip undefined values — Prisma with exactOptionalPropertyTypes
      // requires fields to be omitted entirely rather than set to undefined.
      const updatePayload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined),
      ) as Parameters<typeof ctx.prisma.companyLocation.update>[0]["data"];

      return ctx.prisma.companyLocation.update({
        where: { id: input.id },
        data: updatePayload,
        include: { cityRelation: true },
      });
    }),

  delete: operatorCompanyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingLocation = await ctx.prisma.companyLocation.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!existingLocation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Location not found",
        });
      }

      await ctx.prisma.companyLocation.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
