import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/** Phase 08 — extracted for the enqueue↔payloadSchema contract test. */
export const passengerProfileUpdatedPayloadSchema = z.object({
  email: z.string().email(),
  passengerName: z.string(),
  changedFields: z.array(z.string()),
  phone: z.string().optional(),
});

export const passengerProfileUpdatedWorkflow = workflow(
  "passenger-profile-updated",
  async ({ step, payload }) => {
    // 1. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #475569; margin-top: 0; font-size: 20px; font-weight: bold;">Profile Information Updated</h2>
          <p>Hello ${escapeHtml(payload.passengerName)},</p>
          <p>This is a security alert to confirm that critical settings on your Moja Ride passenger profile have been modified:</p>
          <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 14px; font-family: monospace;">
            Changed settings: ${payload.changedFields.join(", ")}
          </div>
          <p style="font-size: 13px; color: #64748b;">If you did not perform these changes, please secure your account and contact Moja Support immediately.</p>
        </div>
      `;

      return {
        subject: "Security Alert: Your Moja Ride profile was updated",
        body: html,
      };
    });

    // 2. Push Notification
    await step.push("send-push", async () => ({
      subject: "Profile Updated",
      body: `Profile changes applied: ${payload.changedFields.join(", ")}. If this wasn't you, contact support immediately.`,
    }));
  },
  {
    name: "Passenger Profile Updated",
    description:
      "Security warning sent when passenger profile email, phone, or name values are modified",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: passengerProfileUpdatedPayloadSchema,
  },
);
