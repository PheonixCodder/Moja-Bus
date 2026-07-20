import {
  createSavedPassengerSchema,
  deleteSavedPassengerSchema,
  updateSavedPassengerSchema,
  submitReviewSchema,
  updatePreferencesSchema,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { SavedPassengerService } from "@/features/passenger/services/saved-passenger-service";
import { FinancialAccountService } from "@moja/db";
import { paystackInitialize } from "@/features/payments/providers/paystack-client";
import { toSafeDisplayNumber } from "@/lib/money";

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
      let profile = await ctx.prisma.passengerProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!profile) {
        const service = new SavedPassengerService(ctx.prisma);
        await service.ensureProfile(ctx.user.id);
        profile = await ctx.prisma.passengerProfile.findUnique({
          where: { userId: ctx.user.id },
        });
      }

      if (!profile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not provision passenger profile.",
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

      const changedFields: string[] = [];
      if (input.fullName) changedFields.push("Full Name");
      if (input.phone) changedFields.push("Phone Number");
      if (input.preferredSeat) changedFields.push("Preferred Seat");
      if (input.preferredClass) changedFields.push("Preferred Seat Class");
      if (input.marketingOptIn !== undefined) changedFields.push("Marketing Preferences");

      const existingPrefs = (profile.preferencesJson as any) || {};
      const newPrefs = {
        ...existingPrefs,
        ...(input.preferredSeat !== undefined ? { preferredSeat: input.preferredSeat } : {}),
        ...(input.preferredClass !== undefined ? { preferredClass: input.preferredClass } : {}),
      };

      const updatedProfile = await ctx.prisma.passengerProfile.update({
        where: { id: profile.id },
        data: {
          preferencesJson: newPrefs,
          ...(input.marketingOptIn !== undefined ? { marketingOptIn: input.marketingOptIn } : {}),
        },
      });

      // Trigger passenger-profile-updated
      if (changedFields.length > 0 && ctx.user.email) {
        const novuSecret = process.env["NOVU_SECRET_KEY"];
        if (novuSecret) {
          try {
            const { Novu } = await import("@novu/api");
            const novu = new Novu({ secretKey: novuSecret });
            await novu.trigger({
              workflowId: "passenger-profile-updated",
              to: {
                subscriberId: ctx.user.email,
                email: ctx.user.email,
              },
              payload: {
                email: ctx.user.email,
                passengerName: input.fullName || ctx.user.name || "Passenger",
                changedFields,
                phone: input.phone || ctx.user.phone || undefined,
              },
            }).catch(() => {});
          } catch (err) {
            console.error("Failed to trigger passenger-profile-updated via Novu:", err);
          }
        }
      }

      return updatedProfile;
    }),

  updateAvatar: protectedProcedure
    .input(z.object({ image: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { image: input.image },
      });
      return { success: true };
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

      const review = await ctx.prisma.review.create({
        data: {
          companyId: booking.companyId,
          bookingId: input.bookingId,
          rating: input.rating,
          content: input.content || null,
          authorId: ctx.user.id,
        },
      });

      // Trigger passenger-review-submitted
      const company = await ctx.prisma.company.findUnique({
        where: { id: booking.companyId },
        select: { name: true },
      });

      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret && ctx.user.email) {
        try {
          const { Novu } = await import("@novu/api");
          const novu = new Novu({ secretKey: novuSecret });
          await novu.trigger({
            workflowId: "passenger-review-submitted",
            to: {
              subscriberId: ctx.user.email,
              email: ctx.user.email,
            },
            payload: {
              email: ctx.user.email,
              passengerName: ctx.user.name ?? "Passenger",
              companyName: company?.name ?? "Transport Operator",
              rating: input.rating,
              content: input.content ?? undefined,
            },
          }).catch(() => {});
        } catch (err) {
          console.error("Failed to trigger passenger-review-submitted via Novu:", err);
        }
      }

      return review;
    }),

  getUserReviews: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.review.findMany({
      where: { authorId: ctx.user.id },
      select: { bookingId: true, rating: true, content: true },
    });
  }),

  getWalletBalance: protectedProcedure.query(async ({ ctx }) => {
    const accountService = new FinancialAccountService(ctx.prisma);
    const wallet = await accountService.getUserWallet(ctx.user.id);
    return {
      availableBalance: toSafeDisplayNumber(wallet.availableBalance),
      postedBalance: toSafeDisplayNumber(wallet.postedBalance),
      reservedBalance: toSafeDisplayNumber(wallet.reservedBalance),
    };
  }),

  getWalletLedger: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const accountService = new FinancialAccountService(ctx.prisma);
      const wallet = await accountService.getUserWallet(ctx.user.id);

      const [items, total] = await Promise.all([
        ctx.prisma.ledgerEntry.findMany({
          where: { accountId: wallet.id },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.ledgerEntry.count({
          where: { accountId: wallet.id },
        }),
      ]);

      return { 
        items: items.map(i => ({ ...i, amount: toSafeDisplayNumber(i.amount) })),
        total 
      };
    }),

  initiateWalletTopUp: protectedProcedure
    .input(
      z.object({
        amountXOF: z.number().int().positive().min(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const accountService = new FinancialAccountService(ctx.prisma);
      const wallet = await accountService.getUserWallet(ctx.user.id);
      
      const reference = `ref_topup_${wallet.id.slice(-6)}_${Date.now()}`;
      const phone = ctx.user.phone ? ctx.user.phone.replace(/\s+/g, "") : "guest";
      const email = ctx.user.email || `${phone}@guest.mojaride.ci`;

      const payment = await ctx.prisma.externalPayment.create({
        data: {
          provider: "PAYSTACK",
          amountXOF: input.amountXOF,
          status: "INITIALIZED",
          paystackReference: reference,
          metadata: {
            isTopUp: true,
            accountId: wallet.id,
          },
        },
      });

      let initialized;
      try {
        initialized = await paystackInitialize({
          email,
          amountXOF: input.amountXOF,
          reference,
          metadata: {
            isTopUp: true,
            accountId: wallet.id,
          },
          callbackUrl: `${process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"}/dashboard/wallet?topup=pending&ref=${reference}`,
        });
      } catch (error) {
        await ctx.prisma.externalPayment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
        throw error;
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.externalPayment.update({
          where: { id: payment.id },
          data: {
            status: "PENDING",
            metadata: {
              isTopUp: true,
              accountId: wallet.id,
              authorizationUrl: initialized.authorizationUrl,
            },
          },
        });

        await tx.paymentAttempt.create({
          data: {
            paymentId: payment.id,
            attemptNumber: 1,
            paystackReference: reference,
            status: "PENDING",
            metadata: { accessCode: initialized.accessCode },
          },
        });
      });

      return { authorizationUrl: initialized.authorizationUrl };
    }),

  verifyWalletTopUp: protectedProcedure
    .input(z.object({ reference: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { PaymentService } = await import("@/features/payments/payment-service");
      const service = new PaymentService(ctx.prisma);
      return service.verifyTopUp(input.reference);
    }),
});
