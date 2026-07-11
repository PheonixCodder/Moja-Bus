import { workflow } from "@novu/framework";
import { z } from "zod";

export const passengerBookingConfirmedWorkflow = workflow(
  "passenger-booking-confirmed",
  async ({ step, payload }) => {
    // 1. Email Channel (SendGrid)
    await step.email("send-email", async () => {
      const refs = payload.bookingReferences.join(", ");
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #0081F1; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Boarding Pass Confirmed</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${payload.passengerName}, your payment was successful. Present your ticket at boarding.</p>
          
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; color: #334155; border: 1px solid #f1f5f9;">
            <p style="margin: 0 0 8px 0;">Operator: <strong>${payload.companyName}</strong></p>
            <p style="margin: 0 0 8px 0;">Route: <strong>${payload.originCityName} → ${payload.destinationCityName}</strong></p>
            <p style="margin: 0 0 8px 0;">Departure: <strong>${payload.departureTime}</strong></p>
            <p style="margin: 0;">Reference(s): <span style="font-family: monospace; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #0f172a;">${refs}</span></p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 15px;">
            <p style="margin: 0; font-weight: bold; color: #0f172a;">Total Paid: ${payload.totalAmountXOF} XOF</p>
          </div>
        </div>
      `;

      return {
        subject: `Your Moja Ride booking — ${refs}`,
        body: html,
      };
    });

    // 2. In-App Notification (Novu Inbox)
    await step.inApp("send-in-app", async () => ({
      subject: "Booking Confirmed",
      body: `Trip from ${payload.originCityName} to ${payload.destinationCityName} departs at ${payload.departureTime}.`,
      avatar: "https://avatar.vercel.sh/booking",
      redirect: { url: "/dashboard/tickets", target: "_self" },
    }));

    // 3. Conditional SMS Channel (Twilio) if phone exists
    if (payload.phone) {
      await step.sms("send-sms", async () => ({
        body: `Moja Ride: Booking confirmed! Route: ${payload.originCityName} -> ${payload.destinationCityName} at ${payload.departureTime}. Refs: ${payload.bookingReferences.join(", ")}. Total paid: ${payload.totalAmountXOF} XOF.`,
      }));
    }
  },
  {
    name: "Passenger Booking Confirmed",
    description: "Sends multi-channel ticket confirmation and receipt immediately after checkout",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      companyName: z.string(),
      originCityName: z.string(),
      destinationCityName: z.string(),
      departureTime: z.string(),
      bookingReferences: z.array(z.string()),
      totalAmountXOF: z.number(),
      phone: z.string().optional(),
    }),
  }
);
