import {
  createSavedPassengerSchema,
  deleteSavedPassengerSchema,
  updateSavedPassengerSchema,
  submitReviewSchema,
  updatePreferencesSchema,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
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

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const now = new Date();

    const [upcomingTrips, pendingPayments, digitalTickets, savedContacts] = await Promise.all([
      // 1. Upcoming trips (CONFIRMED bookings where trip departure is in the future)
      ctx.prisma.booking.count({
        where: {
          userId,
          status: "CONFIRMED",
          trip: {
            departureDate: {
              gt: now,
            },
          },
        },
      }),
      // 2. Pending payments (PENDING_PAYMENT bookings that haven't expired)
      ctx.prisma.booking.count({
        where: {
          userId,
          status: "PENDING_PAYMENT",
          holdExpiresAt: {
            gt: now,
          },
        },
      }),
      // 3. Digital tickets (CONFIRMED bookings)
      ctx.prisma.booking.count({
        where: {
          userId,
          status: "CONFIRMED",
        },
      }),
      // 4. Saved passengers
      ctx.prisma.savedPassenger.count({
        where: {
          profile: {
            userId,
          },
        },
      }),
    ]);

    return {
      upcomingTripsCount: upcomingTrips,
      pendingPaymentsCount: pendingPayments,
      digitalTicketsCount: digitalTickets,
      savedContactsCount: savedContacts,
    };
  }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.passengerProfile.findUnique({
      where: { userId: ctx.user.id },
      include: { user: { select: { fullName: true, email: true, phone: true } } },
    });

    if (!profile) {
      const service = new SavedPassengerService(ctx.prisma);
      await service.ensureProfile(ctx.user.id);
      return ctx.prisma.passengerProfile.findUnique({
        where: { userId: ctx.user.id },
        include: { user: { select: { fullName: true, email: true, phone: true } } },
      });
    }

    return profile;
  }),

  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.passengerProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }

      if (input.fullName || input.phone) {
        await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: {
            ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
            ...(input.phone ? { phone: input.phone.trim() } : {}),
          },
        });
      }

      const existingPrefs = (profile.preferencesJson as any) || {};
      const newPrefs = {
        ...existingPrefs,
        ...(input.preferredSeat !== undefined ? { preferredSeat: input.preferredSeat } : {}),
        ...(input.preferredClass !== undefined ? { preferredClass: input.preferredClass } : {}),
      };

      return ctx.prisma.passengerProfile.update({
        where: { id: profile.id },
        data: {
          preferencesJson: newPrefs,
          ...(input.marketingOptIn !== undefined ? { marketingOptIn: input.marketingOptIn } : {}),
        },
      });
    }),

  submitReview: protectedProcedure
    .input(submitReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId, userId: ctx.user.id },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found or not associated with your account.",
        });
      }

      const existingReview = await ctx.prisma.review.findUnique({
        where: { bookingId: input.bookingId },
      });

      if (existingReview) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already reviewed this trip.",
        });
      }

      return ctx.prisma.review.create({
        data: {
          companyId: input.companyId,
          bookingId: input.bookingId,
          rating: input.rating,
          content: input.content || null,
          authorId: ctx.user.id,
        },
      });
    }),

  getUserReviews: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.review.findMany({
      where: { authorId: ctx.user.id },
      select: { bookingId: true, rating: true, content: true },
    });
  }),
});
