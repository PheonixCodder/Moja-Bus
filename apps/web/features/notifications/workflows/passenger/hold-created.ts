import { workflow } from "@novu/framework";
import { z } from "zod";

export const passengerHoldCreatedWorkflow = workflow(
  "passenger-hold-created",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Seats Held",
      body: `Seats held! You have until ${payload.expiresAt} to complete checkout for ${payload.destinationCity}.`,
      avatar: "https://avatar.vercel.sh/hold",
      redirect: { url: `/book/${payload.holdId}`, target: "_self" },
    }));

    // 2. SMS Notification
    if (payload.phone) {
      await step.sms("send-sms", async () => ({
        body: `Moja Ride: Seats reserved for your trip ${payload.originCity} -> ${payload.destinationCity} (${payload.departureTime}). Complete payment of ${payload.totalAmountXOF} XOF before ${payload.expiresAt} to confirm.`,
      }));
    }
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
