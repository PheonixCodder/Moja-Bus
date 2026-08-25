import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Phase 07 (F-NF-02) — payload schema extracted as a first-class export so
 * the enqueue↔schema contract test (`__tests__/payload-contracts.test.ts`)
 * validates real producer payloads against exactly what this workflow
 * consumes. Municipality fields are declared (D5) because both producers
 * send them — templates may surface them later.
 */
export const passengerTripDelayedPayloadSchema = z.object({
  email: z.string().email(),
  passengerName: z.string(),
  originCity: z.string(),
  destinationCity: z.string(),
  originMunicipality: z.string().nullable().optional(),
  destinationMunicipality: z.string().nullable().optional(),
  originalTime: z.string(),
  newTime: z.string(),
  delayMinutes: z.number(),
  gate: z.string().nullable().optional(),
  phone: z.string().optional(),
  bookingReference: z.string(),
  // Phase 19 (P3-12) — who reported the delay; copy adapts accordingly.
  reportedBy: z.enum(["OPERATOR", "DRIVER"]).default("OPERATOR").optional(),
});

export const passengerTripDelayedWorkflow = workflow(
  "passenger-trip-delayed",
  async ({ step, payload }) => {
    // 1. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #fcd34d; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #d97706; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Trip Schedule Update</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.passengerName)},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">${
            payload.reportedBy === "DRIVER"
              ? `Your driver reports a delay on your trip from <strong>${escapeHtml(payload.originCity)} to ${escapeHtml(payload.destinationCity)}</strong>.`
              : `The operator has delayed the departure for your upcoming trip from <strong>${escapeHtml(payload.originCity)} to ${escapeHtml(payload.destinationCity)}</strong>.`
          }</p>
          <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #92400e;">
            <p style="margin: 0 0 8px 0;">Delay Duration: <strong>${escapeHtml(payload.delayMinutes)} minutes</strong></p>
            <p style="margin: 0 0 8px 0;">Original Departure: <strong>${escapeHtml(payload.originalTime)}</strong></p>
            <p style="margin: 0 0 8px 0;">New Estimated Departure: <strong>${escapeHtml(payload.newTime)}</strong></p>
            ${payload.gate ? `<p style="margin: 0;">Boarding Gate: <strong>Gate ${escapeHtml(payload.gate)}</strong></p>` : ""}
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">Please adjust your travel plans accordingly. Arrive at the gate at least 15 minutes before the new departure time.</p>
        </div>
      `;

      return {
        subject: "Trip Update: Your departure is delayed",
        body: html,
      };
    });

    // 2. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Trip Delayed",
      body: `Trip to ${escapeHtml(payload.destinationCity)} delayed by ${escapeHtml(payload.delayMinutes)}m. New departure: ${escapeHtml(payload.newTime)}.`,
      avatar: "https://avatar.vercel.sh/delay",
      redirect: { url: "/dashboard/tickets", target: "_self" },
    }));

    // 3. Push Notification
    await step.push("send-push", async () => ({
      subject: "Trip Delayed",
      body: `${escapeHtml(payload.originCity)} → ${escapeHtml(payload.destinationCity)} delayed by ${escapeHtml(payload.delayMinutes)}m. New departure: ${escapeHtml(payload.newTime)}`,
      overrides: { expo: { data: { type: "trip-delayed", bookingReference: payload.bookingReference } } },
    }));
  },
  {
    name: "Passenger Trip Delayed",
    description:
      "Alerts passenger when their trip departure schedule is delayed by the operator",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: passengerTripDelayedPayloadSchema,
  },
);
