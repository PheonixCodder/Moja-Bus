import { workflow } from "@novu/framework";
import { z } from "zod";

export const operatorWelcomeWorkflow = workflow(
  "operator-welcome",
  async ({ step, payload }) => {
    // 1. Send Welcome Email
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; color: #1e293b;">
          <h2 style="color: #ee237c; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Welcome to Moja Ride Business</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${payload.ownerName},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Your transport operator account for <strong>${payload.companyName}</strong> is active. Here is how to get started:</p>
          
          <ol style="line-height: 1.6; padding-left: 20px; font-size: 15px; color: #334155;">
            <li style="margin-bottom: 8px;"><strong>Complete Onboarding</strong>: Upload your business license and registration details.</li>
            <li style="margin-bottom: 8px;"><strong>Setup Payout Settings</strong>: Connect your bank account under settings to receive settlements.</li>
            <li style="margin-bottom: 8px;"><strong>Register Fleet & Staff</strong>: Add your buses, drivers, and dispatchers.</li>
            <li style="margin-bottom: 8px;"><strong>Create Routes & Schedules</strong>: Set up departures and ticket prices.</li>
          </ol>
          
          <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 24px;">Click below to open your onboarding checklist:</p>
          <a href="${payload.dashboardUrl}/dashboard/operator/onboarding" 
             style="display: inline-block; background: #ee237c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px;">
             Open Dashboard Onboarding
          </a>
        </div>
      `;

      return {
        subject: "Welcome to Moja Ride Business - Next Steps",
        body: html,
      };
    });

    // 2. Send In-App Dashboard alert
    await step.inApp("send-in-app", async () => ({
      subject: "Welcome to Moja Ride!",
      body: "Complete your company onboarding steps to start publishing routes.",
      avatar: "https://avatar.vercel.sh/company",
      redirect: { url: "/dashboard/operator/onboarding", target: "_self" },
    }));
  },
  {
    name: "Operator Welcome Onboarding",
    description: "Welcome onboarding sequence for newly registered transport operators",
    payloadSchema: z.object({
      email: z.string().email(),
      ownerName: z.string(),
      companyName: z.string(),
      dashboardUrl: z.string().url(),
    }),
  }
);
