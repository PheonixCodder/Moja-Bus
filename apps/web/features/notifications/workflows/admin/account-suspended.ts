import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const operatorAccountSuspendedWorkflow = workflow(
  "operator-account-suspended",
  async ({ step, payload }) => {
    // 1. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #dc2626; border-radius: 12px; padding: 24px; color: #7f1d1d; background: #fef2f2;">
          <h2 style="color: #dc2626; margin-top: 0; font-size: 20px; font-weight: bold;">Operator Account Suspended</h2>
          <p>Hello ${escapeHtml(payload.operatorName)},</p>
          <p>We are writing to notify you that the transport company account for <strong>${escapeHtml(payload.companyName)}</strong> has been suspended by Moja Ride administration.</p>
          <p>During this suspension, all scheduling, active trip listings, and ticketing services are offline. Operator dashboard logins and manifests will remain restricted.</p>
          <p style="font-size: 13px; color: #b91c1c; font-weight: bold;">If you believe this is in error, please contact Moja Ride operator support immediately.</p>
        </div>
      `;

      return {
        subject: `URGENT: Moja Ride Operator Account Suspended`,
        body: html,
      };
    });

    // 2. SMS Notification
    await step.sms("send-sms", async () => ({
      body: `Moja Ride: Account for ${escapeHtml(payload.companyName)} has been suspended. All scheduling and sales are offline. Contact support.`,
    }), {
      skip: () => !payload.phone,
    });
  },
  {
    name: "Operator Account Suspended",
    description: "Urgent notification sent to operators and managers when their company is suspended",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      operatorName: z.string(),
      companyName: z.string(),
      phone: z.string().optional(),
    }),
  }
);
