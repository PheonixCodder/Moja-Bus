import { workflow } from "@novu/framework";
import { z } from "zod";

export const operatorVerificationApprovedWorkflow = workflow(
  "operator-verification-approved",
  async ({ step, payload }) => {
    // 1. Welcome Activation Email (SendGrid)
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ee237c; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Verification Approved!</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${payload.ownerName},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">We are excited to inform you that verification for <strong>${payload.companyName}</strong> has been approved by the Moja Ride team.</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Your default bank account is verified, and your account status is set to <strong>ACTIVE</strong>. You can now setup departure schedules, sell tickets, and request self-serve withdrawals.</p>
          <a href="https://admin.mojaride.com/dashboard/operator/revenue" 
             style="display: inline-block; background: #ee237c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 16px; text-align: center;">
             Open Revenue Dashboard
          </a>
        </div>
      `;

      return {
        subject: `Your Moja Ride business verification is approved!`,
        body: html,
      };
    });

    // 2. In-App Notification Feed Badge
    await step.inApp("send-in-app", async () => ({
      subject: "Verification Approved",
      body: "Your operator profile is now ACTIVE. You can publish schedules and request payouts.",
      avatar: "https://avatar.vercel.sh/verify-success",
      redirect: { url: "/dashboard/operator/revenue", target: "_self" },
    }));
  },
  {
    name: "Operator Verification Approved",
    description: "Sends welcoming activation details when an admin verifies the company documents and default bank accounts",
    payloadSchema: z.object({
      email: z.string().email(),
      ownerName: z.string(),
      companyName: z.string(),
    }),
  }
);
