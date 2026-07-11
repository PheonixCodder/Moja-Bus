import { workflow } from "@novu/framework";
import { z } from "zod";

export const testWorkflow = workflow(
  "test-workflow",
  async ({ step, payload }) => {
    await step.email("test-email", async () => ({
      subject: "Moja Ride Notification Test",
      body: `Hello ${payload.name}! Your bridge endpoint is fully working.`,
    }));
  },
  {
    name: "Test Notification",
    description: "Initial test workflow to confirm Novu Bridge registration",
    payloadSchema: z.object({
      name: z.string().default("Moja Partner"),
    }),
  }
);
