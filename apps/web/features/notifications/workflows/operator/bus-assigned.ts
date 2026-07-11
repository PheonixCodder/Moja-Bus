import { workflow } from "@novu/framework";
import { z } from "zod";

export const operatorBusAssignedWorkflow = workflow(
  "operator-bus-assigned",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Bus Assignment Updated",
      body: `Bus ${payload.busPlate} has been assigned to trip to ${payload.routeName} departing ${payload.departureTime}.`,
      avatar: "https://avatar.vercel.sh/bus",
      redirect: { url: "/dashboard/operator/trips", target: "_self" },
    }));

    // 2. SMS Notification
    if (payload.phone) {
      await step.sms("send-sms", async () => ({
        body: `Moja Operator Alert: You are assigned to Bus ${payload.busPlate} for route ${payload.routeName} departing ${payload.departureTime}. Log in to view manifest.`,
      }));
    }
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
