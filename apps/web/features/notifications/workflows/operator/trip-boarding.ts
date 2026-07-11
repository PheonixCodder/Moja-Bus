import { workflow } from "@novu/framework";
import { z } from "zod";

export const passengerTripBoardingWorkflow = workflow(
  "passenger-trip-boarding",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Boarding Started",
      body: `Boarding has started for your trip to ${payload.destinationCity}! ${payload.gate ? `Proceed to Gate ${payload.gate}.` : ""}`,
      avatar: "https://avatar.vercel.sh/boarding",
      redirect: { url: "/dashboard/tickets", target: "_self" },
    }));

    // 2. SMS Notification
    if (payload.phone) {
      await step.sms("send-sms", async () => ({
        body: `Moja Ride Boarding: Boarding has started for your trip to ${payload.destinationCity}. Proceed to ${payload.gate ? `Gate ${payload.gate}` : "the boarding terminal"}. Vehicle Plate: ${payload.busPlate ?? "Assigned bus"}.`,
      }));
    }
  },
  {
    name: "Passenger Trip Boarding Commenced",
    description: "Alerts passenger at the terminal when their bus boarding status changes to active",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      destinationCity: z.string(),
      gate: z.string().nullable().optional(),
      busPlate: z.string().nullable().optional(),
      phone: z.string().optional(),
    }),
  }
);
