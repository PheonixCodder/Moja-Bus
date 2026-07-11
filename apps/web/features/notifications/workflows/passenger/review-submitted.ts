import { workflow } from "@novu/framework";
import { z } from "zod";

export const passengerReviewSubmittedWorkflow = workflow(
  "passenger-review-submitted",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Review Submitted",
      body: `Thank you for your ${payload.rating}-star review of ${payload.companyName}! Your feedback helps us keep the ride safe.`,
      avatar: "https://avatar.vercel.sh/review-success",
      redirect: { url: "/dashboard/bookings", target: "_self" },
    }));
  },
  {
    name: "Passenger Review Submitted",
    description: "Confirms and thanks the traveler when a trip rating and review is successfully submitted",
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      companyName: z.string(),
      rating: z.number(),
      content: z.string().optional(),
    }),
  }
);
