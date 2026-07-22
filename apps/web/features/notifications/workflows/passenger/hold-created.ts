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
      redirect: { url: `/book/${escapeHtml(payload.holdId)}`, target: "_self" },
    }));

    // 2. SMS Notification
    await step.sms("send-sms", async () => ({
      body: `Moja Ride: Seats reserved for your trip ${escapeHtml(payload.originCity)} -> ${escapeHtml(payload.destinationCity)} (${escapeHtml(payload.departureTime)}). Complete payment of ${escapeHtml(payload.totalAmountXOF)} XOF before ${escapeHtml(payload.expiresAt)} to confirm.`,
    }), {
      skip: () => !payload.phone,
    });
  },
  {
    name: "Passenger Hold Created",
    description: "Alerts passenger when seat reservations are held and tells them when the payment window expires",
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
  }
);
