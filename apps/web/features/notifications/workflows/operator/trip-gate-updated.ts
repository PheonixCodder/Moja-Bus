import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const passengerTripGateUpdatedWorkflow = workflow(
  "passenger-trip-gate-updated",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Boarding Gate Updated",
      body: `Proceed to Gate ${escapeHtml(payload.gate)} for your trip to ${escapeHtml(payload.destinationCity)}.`,
      avatar: "https://avatar.vercel.sh/gate",
      redirect: { url: "/dashboard/tickets", target: "_self" },
    }));

    // 2. SMS Notification
    if (payload.phone) {
      await step.sms("send-sms", async () => ({
        body: `Moja Ride Update: The gate for your trip to ${escapeHtml(payload.destinationCity)} (${escapeHtml(payload.departureTime)}) is set to Gate ${escapeHtml(payload.gate)}.`,
      }));
    }
  },
  {
    name: "Passenger Trip Gate Updated",
    description: "Alerts passenger when their physical boarding gate/bay changes at the terminal",
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      destinationCity: z.string(),
      departureTime: z.string(),
      gate: z.string(),
      phone: z.string().optional(),
    }),
  }
);
