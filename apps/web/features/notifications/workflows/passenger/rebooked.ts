import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Phase 33 (F-PS-16) — payload schema extracted as a first-class export so
 * the enqueue→schema contract test (`__tests__/payload-contracts.test.ts`)
 * validates real producer payloads against exactly what this workflow
 * consumes. Never inline-edit this shape without updating the contract rows.
 */
export const passengerRebookedPayloadSchema = z.object({
  email: z.string().email(),
  passengerName: z.string(),
  oldBookingReference: z.string(),
  newBookingReference: z.string(),
  companyName: z.string(),
  /** Human-formatted departure of the NEW trip (Africa/Abidjan). */
  departureTime: z.string(),
  seatLabel: z.string(),
});

/**
 * Phase 33 (F-PS-16) — replaces the rebooking console.log stub that rendered
 * passengers as "notified" while emitting nothing. Operator-initiated
 * rebookings now ride the durable outbox like every other passenger notice.
 *
 * USER ACTION (one-time, Novu dashboard): create the dashboard twin workflow
 * with id "passenger-rebooked" so local registration maps to a real remote.
 */
export const passengerRebookedWorkflow = workflow(
  "passenger-rebooked",
  async ({ step, payload }) => {
    // 1. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #fcd34d; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #d97706; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Your Trip Was Rescheduled</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.passengerName)},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Good news — your booking <strong>${escapeHtml(payload.oldBookingReference)}</strong> with <strong>${escapeHtml(payload.companyName)}</strong> has been successfully rescheduled by our operations team.</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #92400e;">
            <p style="margin: 0 0 8px 0;">New departure: <strong>${escapeHtml(payload.departureTime)}</strong></p>
            <p style="margin: 0;">Seat: <strong>${escapeHtml(payload.seatLabel)}</strong> &middot; New reference: <strong>${escapeHtml(payload.newBookingReference)}</strong></p>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">Your digital ticket is already available in the Moja Ride app under Bookings.</p>
        </div>
      `;
      return {
        subject: "Your trip has been rescheduled — new details inside",
        body: html,
      };
    });

    // 2. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Trip Rescheduled",
      body: `Booking ${payload.oldBookingReference} was rescheduled. New departure: ${payload.departureTime}, seat ${payload.seatLabel}. New reference: ${payload.newBookingReference}.`,
      avatar: "https://avatar.vercel.sh/rebook",
      redirect: { url: "/dashboard/bookings", target: "_self" },
    }));

    // 3. Push Notification
    await step.push("send-push", async () => ({
      subject: "Trip Rescheduled",
      body: `New departure ${payload.departureTime} · seat ${payload.seatLabel}. Ref ${payload.newBookingReference}.`,
      overrides: {
        expo: {
          data: {
            type: "trip-rescheduled",
            bookingReference: payload.newBookingReference,
          },
        },
      },
    }));
  },
  {
    name: "Passenger Trip Rebooked",
    description:
      "Confirms to the passenger that an operator rebooked their booking onto a new departure, with the new reference and seat",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: passengerRebookedPayloadSchema,
  },
);
