import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const passengerTicketSharedWorkflow = workflow(
  "passenger-ticket-shared",
  async ({ step, payload }) => {
    // 1. Email Notification (if email recipient wants it)
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #ee237c; border-radius: 12px; padding: 24px; color: #1e293b; text-align: center;">
          <h2 style="color: #ee237c; margin-top: 0; font-size: 24px; font-weight: bold;">Ticket Shared With You!</h2>
          <p>Hello ${escapeHtml(payload.passengerName)},</p>
          <p><strong>${escapeHtml(payload.senderName)}</strong> has shared a digital bus ticket to <strong>${escapeHtml(payload.destinationCity)}</strong> with you.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; text-align: left;">
            <p style="margin: 0 0 8px 0;">Route: <strong>${escapeHtml(payload.originCity)} to ${escapeHtml(payload.destinationCity)}</strong></p>
            <p style="margin: 0;">Departure: <strong>${escapeHtml(payload.departureTime)}</strong></p>
          </div>
          <a href="https://mojaride.com/tickets/${escapeHtml(payload.ticketToken)}" 
             style="display: inline-block; background: #ee237c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 16px auto;">
             View Digital Ticket
          </a>
        </div>
      `;

      return {
        subject: `${escapeHtml(payload.senderName)} shared a Moja Ride ticket with you!`,
        body: html,
      };
    });

    // 2. SMS Notification
    await step.sms("send-sms", async () => ({
      body: `Moja Ride: ${escapeHtml(payload.senderName)} shared a bus ticket to ${escapeHtml(payload.destinationCity)} (${escapeHtml(payload.departureTime)}) with you! View ticket here: https://mojaride.com/tickets/${escapeHtml(payload.ticketToken)}`,
    }), {
      skip: () => !payload.phone,
    });
  },
  {
    name: "Passenger Ticket Shared",
    description: "Sends digital ticket URLs to guests or friends when shared by the booking owner",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      senderName: z.string(),
      originCity: z.string(),
      destinationCity: z.string(),
      departureTime: z.string(),
      ticketToken: z.string(),
      phone: z.string().optional(),
    }),
  }
);
