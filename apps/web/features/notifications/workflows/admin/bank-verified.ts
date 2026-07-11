import { workflow } from "@novu/framework";
import { z } from "zod";

export const operatorBankVerifiedWorkflow = workflow(
  "operator-bank-verified",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Bank Account Verified",
      body: `✅ Bank account ${payload.bankName} (${payload.accountNumberHidden}) verified successfully. You can now request payouts to this account.`,
      avatar: "https://avatar.vercel.sh/bank-verified",
      redirect: { url: "/dashboard/operator/settings", target: "_self" },
    }));

    // 2. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #10b981; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #10b981; margin-top: 0; font-size: 20px; font-weight: bold;">Bank Account Verified</h2>
          <p>Hello ${payload.ownerName},</p>
          <p>We are pleased to inform you that your registered bank account for <strong>${payload.companyName}</strong> has been verified by the platform administrators.</p>
          <div style="background: #f0fdf4; border: 1px solid #d1fae5; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; color: #065f46;">
            <p style="margin: 0 0 8px 0;">Bank: <strong>${payload.bankName}</strong></p>
            <p style="margin: 0;">Account: <strong>${payload.accountNumberHidden}</strong></p>
          </div>
          <p>This bank account has been set as your default destination for operator revenue payouts and withdrawals.</p>
        </div>
      `;

      return {
        subject: `Bank Account Verified - ${payload.companyName}`,
        body: html,
      };
    });
  },
  {
    name: "Operator Bank Account Verified",
    description: "Alerts transport operators when their registered bank account has been approved and verified by admins",
    payloadSchema: z.object({
      email: z.string().email(),
      ownerName: z.string(),
      companyName: z.string(),
      bankName: z.string(),
      accountNumberHidden: z.string(),
    }),
  }
);
