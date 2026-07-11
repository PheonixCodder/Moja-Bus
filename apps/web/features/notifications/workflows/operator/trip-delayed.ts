import { workflow } from "@novu/framework";
import { z } from "zod";

export const passengerTripDelayedWorkflow = workflow(
  "passenger-trip-delayed",
  async ({ step, payload }) => {
    // 1. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #fcd34d; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #d97706; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Trip Schedule Update</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${payload.passengerName},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">The operator has delayed the departure for your upcoming trip from <strong>${payload.originCity} to ${payload.destinationCity}</strong>.</p>
          <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #92400e;">
            <p style="margin: 0 0 8px 0;">Delay Duration: <strong>${payload.delayMinutes} minutes</strong></p>
            <p style="margin: 0 0 8px 0;">Original Departure: <strong>${payload.originalTime}</strong></p>
            <p style="margin: 0 0 8px 0;">New Estimated Departure: <strong>${payload.newTime}</strong></p>
            ${payload.gate ? `<p style="margin: 0;">Boarding Gate: <strong>Gate ${payload.gate}</strong></p>` : ""}
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
      body: `Trip to ${payload.destinationCity} delayed by ${payload.delayMinutes}m. New departure: ${payload.newTime}.`,
      avatar: "https://avatar.vercel.sh/delay",
      redirect: { url: "/dashboard/tickets", target: "_self" },
    }));

    // 3. SMS Notification
    if (payload.phone) {
      await step.sms("send-sms", async () => ({
        body: `Moja Ride Alert: Your trip from ${payload.originCity} to ${payload.destinationCity} (scheduled for ${payload.originalTime}) is delayed by ${payload.delayMinutes} mins. New departure time: ${payload.newTime}.${payload.gate ? ` Please board at Gate ${payload.gate}.` : ""}`,
      }));
    }
  },
  {
    name: "Passenger Trip Delayed",
    description: "Alerts passenger when their trip departure schedule is delayed by the operator",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      originCity: z.string(),
      destinationCity: z.string(),
      originalTime: z.string(),
      newTime: z.string(),
      delayMinutes: z.number(),
      gate: z.string().nullable().optional(),
      phone: z.string().optional(),
    }),
  }
);
