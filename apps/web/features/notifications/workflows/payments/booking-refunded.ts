import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const passengerBookingRefundedWorkflow = workflow(
  "passenger-booking-refunded",
  async ({ step, payload }) => {
    // 1. Email Channel
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #64748b; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Ticket Refunded</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.passengerName)}, your booking has been cancelled and refunded.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; color: #334155; border: 1px solid #f1f5f9;">
            <p style="margin: 0 0 8px 0;">Reference: <strong>${escapeHtml(payload.bookingReference)}</strong></p>
            <p style="margin: 0 0 8px 0;">Refund Amount: <strong>${escapeHtml(payload.refundAmountXOF)} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Refund Channel: <strong>${escapeHtml(payload.channel)}</strong></p>
            <p style="margin: 0; color: #64748b;">Reason: "${escapeHtml(payload.reason)}"</p>
          </div>
          ${payload.channel === "WALLET" ? `<p style="font-size: 13px; color: #64748b; margin-bottom: 0;">The funds have been credited to your internal Passenger Wallet balance.</p>` : ""}
        </div>
      `;

      return {
        subject: `Refund confirmed: Booking ${escapeHtml(payload.bookingReference)}`,
        body: html,
      };
    });

    // 2. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Ticket Refunded",
      body: `Ticket ${escapeHtml(payload.bookingReference)} cancelled. ${escapeHtml(payload.refundAmountXOF)} XOF refunded to your ${escapeHtml(payload.channel)}.`,
      avatar: "https://avatar.vercel.sh/refund",
      redirect: { url: "/dashboard/wallet", target: "_self" },
    }));
  },
  {
    name: "Passenger Booking Refunded",
    description: "Sends refund notification to traveler when a booking is cancelled",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      bookingReference: z.string(),
      refundAmountXOF: z.number(),
      channel: z.enum(["WALLET", "CASH", "VOUCHER"]),
      reason: z.string(),
    }),
  }
);
