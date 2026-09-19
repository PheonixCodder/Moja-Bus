import { ChatOrPushProviderEnum } from "@novu/api/models/components";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "crypto";
import { getNovuClient } from "@/lib/novu";
import { createTRPCRouter, protectedProcedure } from "../init";

export const notificationProcedures = {
	getNotificationToken: protectedProcedure.query(async ({ ctx }) => {
		const secret = process.env["NOVU_SECRET_KEY"];
		if (!secret) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Notification secret is not configured on server",
			});
		}

		// P0-3 — subscriber identity is user.id platform-wide (matches server triggers).
		const subscriberId = ctx.user.id;
		const subscriberHash = crypto
			.createHmac("sha256", secret)
			.update(subscriberId)
			.digest("hex");

		return {
			subscriberId,
			subscriberHash,
			appId: process.env["NEXT_PUBLIC_NOVU_APP_ID"] || "",
		};
	}),

	registerPushToken: protectedProcedure
		.input(
			z.object({ token: z.string(), platform: z.enum(["android", "ios"]) }),
		)
		.mutation(async ({ ctx, input }) => {
			const novu = getNovuClient();
			if (!novu) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Notification service is not configured",
				});
			}

			const subscriberId = ctx.user.id;
			const providerId = ChatOrPushProviderEnum.Expo;

			try {
				// Phase 21 (F-NF-06) — APPEND, not replace: driver + traveler apps
				// share one user.id subscriber, so replace-semantics meant whichever
				// app registered last silently killed the other's push. Append adds
				// this token while keeping every other device's token intact.
				await novu.subscribers.credentials.append(
					{
						providerId,
						credentials: { deviceTokens: [input.token] },
					},
					subscriberId,
				);
			} catch (err) {
				console.error("[NOVU] Failed to register push token:", err);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to register push token",
				});
			}
		}),

	markNotificationAsRead: protectedProcedure
		.input(z.object({ notificationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const novu = getNovuClient();
			if (!novu) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Notification service is not configured",
				});
			}

			const subscriberId = ctx.user.id;
			try {
				await novu.subscribers.notifications.markAsRead({
					notificationId: input.notificationId,
					subscriberId,
				});
			} catch (err) {
				console.error("[NOVU] Failed to mark notification as read:", err);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to mark notification as read",
				});
			}
		}),
};

export const notificationsRouter = createTRPCRouter(notificationProcedures);
