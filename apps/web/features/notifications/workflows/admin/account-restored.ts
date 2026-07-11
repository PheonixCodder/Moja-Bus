import { workflow } from "@novu/framework";
import { z } from "zod";

export const operatorAccountRestoredWorkflow = workflow(
  "operator-account-restored",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Account Reactivated",
      body: `🎉 Welcome back! ${payload.companyName} account is reactivated. Routes and scheduling are online.`,
      avatar: "https://avatar.vercel.sh/account-active",
      redirect: { url: "/dashboard/operator", target: "_self" },
    }));

    // 2. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #10b981; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #10b981; margin-top: 0; font-size: 20px; font-weight: bold;">Operator Account Reactivated</h2>
          <p>Hello ${payload.ownerName},</p>
          <p>We are pleased to inform you that your company account <strong>${payload.companyName}</strong> has been reactivated and fully restored by Moja Ride administration.</p>
          <p>All active services, route scheduling, ticket sales, and dispatcher boards are back online. You can now access your operator dashboard normally.</p>
          <p>Thank you for partnering with Moja Ride!</p>
        </div>
      `;

      return {
        subject: `Your Moja Ride Operator Account is Reactivated`,
        body: html,
      };
    });
  },
  {
    name: "Operator Account Restored",
    description: "Alerts transport operators when their suspended company account is reactivated",
    payloadSchema: z.object({
      email: z.string().email(),
      ownerName: z.string(),
      companyName: z.string(),
    }),
  }
);
