import { workflow } from "@novu/framework";
import { z } from "zod";

export const operatorVerificationRejectedWorkflow = workflow(
  "operator-verification-rejected",
  async ({ step, payload }) => {
    // 1. Verification Rejection Email
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #fca5a5; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ef4444; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Verification Documents Rejected</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${payload.ownerName},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">The verification documents submitted for <strong>${payload.companyName}</strong> were rejected for the following reason:</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #991b1b;">
            "<strong>${payload.reason}</strong>"
          </div>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Please log in to your dashboard and re-upload valid documents under settings to retry verification.</p>
          <a href="https://admin.mojaride.com/dashboard/operator/settings" 
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 16px; text-align: center;">
             Update Company Documents
          </a>
        </div>
      `;

      return {
        subject: `ACTION REQUIRED: Business verification rejected`,
        body: html,
      };
    });

    // 2. High priority dashboard badge alert
    await step.inApp("send-in-app", async () => ({
      subject: "Verification Documents Rejected",
      body: `Verification documents rejected: ${payload.reason}. Please re-upload documents in settings.`,
      avatar: "https://avatar.vercel.sh/verify-rejected",
      redirect: { url: "/dashboard/operator/settings", target: "_self" },
    }));
  },
  {
    name: "Operator Verification Rejected",
    description: "Sends document rejection notice explaining issues to the operator company",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      ownerName: z.string(),
      companyName: z.string(),
      reason: z.string(),
    }),
  }
);
