import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const passengerReviewRequestWorkflow = workflow(
  "passenger-review-request",
  async ({ step, payload }) => {
    // 1. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b; text-align: center;">
          <h2 style="color: #ee237c; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Welcome Back!</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.passengerName)},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Thank you for riding with <strong>${escapeHtml(payload.companyName)}</strong> on your trip from <strong>${escapeHtml(payload.originCity)} to ${escapeHtml(payload.destinationCity)}</strong>.</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-bottom: 24px;">We want to ensure you had a safe and comfortable journey. Please take 30 seconds to rate your experience:</p>
          <a href="${process.env["APP_URL"] || "https://mojaride.com"}/dashboard/tickets/${escapeHtml(payload.bookingReference)}/review" 
             style="display: inline-block; background: #ee237c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 16px auto;">
             Share Your Review
          </a>
        </div>
      `;

      return {
        subject: `How was your trip with ${escapeHtml(payload.companyName)}?`,
        body: html,
      };
    });

    // 2. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Leave a Review",
      body: `Welcome back! Rate your recent journey from ${escapeHtml(payload.originCity)} to ${escapeHtml(payload.destinationCity)} with ${escapeHtml(payload.companyName)}.`,
      avatar: "https://avatar.vercel.sh/review",
      redirect: { url: "/dashboard/tickets", target: "_self" },
    }));
  },
  {
    name: "Passenger Review Request",
    description: "Triggers automatically after trip completion to request a feedback review from the traveler",
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      companyName: z.string(),
      originCity: z.string(),
      destinationCity: z.string(),
      tripId: z.string(),
      bookingReference: z.string(),
    }),
  }
);
