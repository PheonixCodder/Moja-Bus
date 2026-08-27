import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Phase 07 (F-NF-01) — payload schema extracted as a first-class export so
 * the enqueue↔schema contract test (`__tests__/payload-contracts.test.ts`)
 * validates real producer payloads against exactly what this workflow
 * consumes. Never inline-edit this shape without updating the contract rows.
 */
export const passengerTripCancelledPayloadSchema = z.object({
  email: z.string().email(),
  passengerName: z.string(),
  originCity: z.string(),
  destinationCity: z.string(),
  departureTime: z.string(),
  cancelReason: z.string(),
  // Phase 07 D1/D2 rulings — always present, so a FAILED refund can never be
  // silently rendered as a completed wallet credit.
  refundAmountXOF: z.number(),
  refundStatus: z.enum(["success", "failed"]),
  refundChannel: z.enum(["WALLET", "CASH"]).optional(),
  phone: z.string().optional(),
  bookingReference: z.string(),
});

export const passengerTripCancelledWorkflow = workflow(
  "passenger-trip-cancelled",
  async ({ step, payload }) => {
    const refundLine = (() => {
      if (payload.refundStatus === "failed") {
        return "Our operations team will process your refund — no action is needed from you. Contact support if you have any questions.";
      }
      if (payload.refundChannel === "CASH") {
        return `Your refund of ${escapeHtml(payload.refundAmountXOF)} XOF will be settled manually by the operator — please collect it per their instructions.`;
      }
      return `A refund of ${escapeHtml(payload.refundAmountXOF)} XOF has been credited back to your Moja Passenger Wallet balance.`;
    })();

    // 1. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #fca5a5; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ef4444; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Trip Cancellation Notice</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.passengerName)},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">We regret to inform you that your upcoming trip from <strong>${escapeHtml(payload.originCity)} to ${escapeHtml(payload.destinationCity)}</strong> scheduled for <strong>${escapeHtml(payload.departureTime)}</strong> has been cancelled by the transport operator.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #991b1b;">
            <p style="margin: 0 0 8px 0;">Reason for Cancellation: <strong>"${escapeHtml(payload.cancelReason)}"</strong></p>
            ${payload.refundStatus === "success" ? `<p style="margin: 0;">Refund Amount: <strong>${escapeHtml(payload.refundAmountXOF)} XOF</strong></p>` : ""}
          </div>
          <p style="font-weight: bold; color: #ef4444; font-size: 15px; line-height: 1.5;">${refundLine}</p>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">If you have any questions or need to book a replacement trip, please visit the Moja Ride dashboard.</p>
        </div>
      `;

      return {
        subject: "URGENT: Your trip has been cancelled",
        body: html,
      };
    });

    // 2. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Trip Cancelled",
      body: `Trip to ${escapeHtml(payload.destinationCity)} (${escapeHtml(payload.departureTime)}) was CANCELLED: ${escapeHtml(payload.cancelReason)}. ${
        payload.refundStatus === "success"
          ? `${payload.refundAmountXOF} XOF refunded.`
          : "Refund to be processed by our team."
      }`,
      avatar: "https://avatar.vercel.sh/cancel",
      redirect: { url: "/dashboard/wallet", target: "_self" },
    }));

    // 3. Push Notification
    await step.push("send-push", async () => ({
      subject: "Trip Cancelled",
      body: `${escapeHtml(payload.originCity)} → ${escapeHtml(payload.destinationCity)} cancelled. ${escapeHtml(payload.cancelReason)}. ${
        payload.refundStatus === "success"
          ? `${escapeHtml(payload.refundAmountXOF)} XOF refunded${payload.refundChannel === "CASH" ? " (manual settlement)" : " to wallet"}.`
          : "Refund will be processed by our team."
      }`,
      overrides: {
        expo: {
          data: {
            type: "trip-cancelled",
            bookingReference: payload.bookingReference,
          },
        },
      },
    }));
  },
  {
    name: "Passenger Trip Cancelled",
    description:
      "Alerts passenger when their trip departure is cancelled by the operator, detailing refund status",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: passengerTripCancelledPayloadSchema,
  },
);
