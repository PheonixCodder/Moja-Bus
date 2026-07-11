import { workflow } from "@novu/framework";
import { z } from "zod";

export const adminOperatorSignupPendingWorkflow = workflow(
  "admin-operator-signup-pending",
  async ({ step, payload }) => {
    // 1. In-App Notification for admins
    await step.inApp("send-in-app", async () => ({
      subject: "Operator Verification Pending",
      body: `🆕 Company ${payload.companyName} submitted verification documents. Review pending.`,
      avatar: "https://avatar.vercel.sh/onboarding-pending",
      redirect: { url: "/dashboard/admin/verification", target: "_self" },
    }));

    // 2. Email Notification for admins
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #ee237c; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ee237c; margin-top: 0; font-size: 20px; font-weight: bold;">Action Required: Verification Pending</h2>
          <p>Hello Admin,</p>
          <p>A new transport operator has completed onboarding and submitted documents for verification:</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Company Name: <strong>${payload.companyName}</strong></p>
            <p style="margin: 0 0 8px 0;">Owner: <strong>${payload.ownerName}</strong></p>
            <p style="margin: 0 0 8px 0;">Phone: <strong>${payload.ownerPhone}</strong></p>
            <p style="margin: 0;">Submitted: <strong>${payload.submittedAt}</strong></p>
          </div>
          <a href="https://mojaride.com/dashboard/admin/verification" 
             style="display: inline-block; background: #ee237c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 10px;">
             Review Verification
          </a>
        </div>
      `;

      return {
        subject: `Action Required: Verification Pending for ${payload.companyName}`,
        body: html,
      };
    });
  },
  {
    name: "Admin Operator Onboarding Pending",
    description: "Alerts admins when a new transport company finishes onboarding and requests account verification",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      adminEmail: z.string().email(),
      companyId: z.string(),
      companyName: z.string(),
      ownerName: z.string(),
      ownerPhone: z.string(),
      submittedAt: z.string(),
    }),
  }
);
