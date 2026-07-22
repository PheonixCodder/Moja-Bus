import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const operatorBusAssignedWorkflow = workflow(
  "operator-bus-assigned",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Bus Assignment Updated",
      body: `Bus ${escapeHtml(payload.busPlate)} has been assigned to trip to ${escapeHtml(payload.routeName)} departing ${escapeHtml(payload.departureTime)}.`,
      avatar: "https://avatar.vercel.sh/bus",
      redirect: { url: "/dashboard/operator/trips", target: "_self" },
    }));

    // 2. SMS Notification
    await step.sms("send-sms", async () => ({
      body: `Moja Operator Alert: You are assigned to Bus ${escapeHtml(payload.busPlate)} for route ${escapeHtml(payload.routeName)} departing ${escapeHtml(payload.departureTime)}. Log in to view manifest.`,
    }), {
      skip: () => !payload.phone,
    });
  },
  {
    name: "Operator Bus Assigned",
    description: "Alerts operator staff / drivers when a vehicle is assigned or swapped for a departure",
    payloadSchema: z.object({
      email: z.string().email(),
      staffName: z.string(),
      busPlate: z.string(),
      routeName: z.string(),
      departureTime: z.string(),
      phone: z.string().optional(),
    }),
  }
);
