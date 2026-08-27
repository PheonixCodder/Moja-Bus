import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

export const passengerHoldCreatedWorkflow = workflow(
  "passenger-hold-created",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Seats Held",
      body: `Seats held! You have until ${escapeHtml(payload.expiresAt)} to complete checkout for ${escapeHtml(payload.destinationCity)}.`,
      avatar: "https://avatar.vercel.sh/hold",
      redirect: { url: "/dashboard/bookings?tab=pending", target: "_self" },
    }));

    // 2. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #0081F1; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Seats Temporarily Held</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.passengerName)},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Your seat reservation from <strong>${escapeHtml(payload.originCity)} to ${escapeHtml(payload.destinationCity)}</strong> (${escapeHtml(payload.departureTime)}) has been placed on hold.</p>
          
          <div style="background: #f8fafc; border-left: 4px solid #0081F1; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #334155;">
            <p style="margin: 0 0 8px 0;">Total Amount: <strong>${escapeHtml(payload.totalAmountXOF)} XOF</strong></p>
            <p style="margin: 0;">Payment Deadline: <strong style="color: #ef4444;">${escapeHtml(payload.expiresAt)}</strong></p>
          </div>
          
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">Please complete your checkout before the deadline to confirm your booking.</p>
        </div>
      `;

      return {
        subject: `Seats Held: Complete checkout for your trip to ${escapeHtml(payload.destinationCity)}`,
        body: html,
      };
    });

    // 3. Push Notification
    await step.push("send-push", async () => ({
      subject: "Seats Held",
      body: `Seats held for ${escapeHtml(payload.destinationCity)} departing ${escapeHtml(payload.departureTime)}. Pay by ${escapeHtml(payload.expiresAt)}.`,
      overrides: { expo: { data: { type: "hold-created" } } },
    }));
  },
  {
    name: "Passenger Hold Created",
    description:
      "Alerts passenger when seat reservations are held and tells them when the payment window expires",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      originCity: z.string(),
      destinationCity: z.string(),
      departureTime: z.string(),
      holdId: z.string(),
      expiresAt: z.string(),
      totalAmountXOF: z.number(),
      phone: z.string().optional(),
    }),
  },
);
