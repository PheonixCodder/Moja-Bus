import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const passengerTripCancelledWorkflow = workflow(
  "passenger-trip-cancelled",
  async ({ step, payload }) => {
    // 1. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #fca5a5; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ef4444; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Trip Cancellation Notice</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.passengerName)},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">We regret to inform you that your upcoming trip from <strong>${escapeHtml(payload.originCity)} to ${escapeHtml(payload.destinationCity)}</strong> scheduled for <strong>${escapeHtml(payload.departureTime)}</strong> has been cancelled by the transport operator.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #991b1b;">
            <p style="margin: 0 0 8px 0;">Reason for Cancellation: <strong>"${escapeHtml(payload.cancelReason)}"</strong></p>
            <p style="margin: 0;">Refund Amount: <strong>${escapeHtml(payload.refundAmountXOF)} XOF</strong></p>
          </div>
          <p style="font-weight: bold; color: #ef4444; font-size: 15px; line-height: 1.5;">A full refund has been credited back to your internal Passenger Wallet balance.</p>
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
      body: `Trip to ${escapeHtml(payload.destinationCity)} (${escapeHtml(payload.departureTime)}) was CANCELLED: ${escapeHtml(payload.cancelReason)}. Balance refunded.`,
      avatar: "https://avatar.vercel.sh/cancel",
      redirect: { url: "/dashboard/wallet", target: "_self" },
    }));

    // 3. SMS Notification
    await step.sms("send-sms", async () => ({
      body: `Moja Ride URGENT: Trip from ${escapeHtml(payload.originCity)} to ${escapeHtml(payload.destinationCity)} (${escapeHtml(payload.departureTime)}) has been CANCELLED due to: ${escapeHtml(payload.cancelReason)}. ${escapeHtml(payload.refundAmountXOF)} XOF has been refunded to your wallet.`,
    }), {
      skip: () => !payload.phone,
    });
  },
  {
    name: "Passenger Trip Cancelled",
    description: "Alerts passenger when their trip departure is cancelled by the operator, detailing wallet refund",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      originCity: z.string(),
      destinationCity: z.string(),
      departureTime: z.string(),
      cancelReason: z.string(),
      refundAmountXOF: z.number(),
      phone: z.string().optional(),
    }),
  }
);
