import {
  createSavedPassengerSchema,
  deleteSavedPassengerSchema,
  updateSavedPassengerSchema,
} from "@moja/schemas";
import { createTRPCRouter, protectedProcedure } from "../init";
import { SavedPassengerService } from "@/features/passenger/services/saved-passenger-service";

export const passengerRouter = createTRPCRouter({
  ensureProfile: protectedProcedure.query(async ({ ctx }) => {
    const service = new SavedPassengerService(ctx.prisma);
    return service.ensureProfile(ctx.user.id);
  }),

  listSaved: protectedProcedure.query(async ({ ctx }) => {
    const service = new SavedPassengerService(ctx.prisma);
    return service.listSaved(ctx.user.id);
  }),

  createSaved: protectedProcedure
    .input(createSavedPassengerSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new SavedPassengerService(ctx.prisma);
      return service.createSaved(ctx.user.id, input);
    }),

  updateSaved: protectedProcedure
    .input(updateSavedPassengerSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new SavedPassengerService(ctx.prisma);
      return service.updateSaved(ctx.user.id, input);
    }),

  deleteSaved: protectedProcedure
    .input(deleteSavedPassengerSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new SavedPassengerService(ctx.prisma);
      return service.deleteSaved(ctx.user.id, input.id);
    }),
});
