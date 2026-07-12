import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const adminPayoutFailedWorkflow = workflow(
  "admin-payout-failed",
  async ({ step, payload }) => {
    // 1. In-App Notification for admins
    await step.inApp("send-in-app", async () => ({
      subject: "Payout Transfer Failed",
      body: `❌ Payout of ${escapeHtml(payload.amountXOF)} XOF failed for ${escapeHtml(payload.companyName)}. Error: ${escapeHtml(payload.errorMessage)}.`,
      avatar: "https://avatar.vercel.sh/payout-failed",
      redirect: { url: "/dashboard/admin/withdrawals", target: "_self" },
    }));

    // 2. Email Notification for admins
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #ef4444; border-radius: 12px; padding: 24px; color: #7f1d1d; background: #fef2f2;">
          <h2 style="color: #ef4444; margin-top: 0; font-size: 20px; font-weight: bold;">CRITICAL: Payout/Withdrawal Failure</h2>
          <p>Hello Admin,</p>
          <p>An operator payout has failed or was manually marked as failed in the system:</p>
          <div style="background: white; border: 1px solid #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; color: #1e293b;">
            <p style="margin: 0 0 8px 0;">Company: <strong>${escapeHtml(payload.companyName)}</strong></p>
            <p style="margin: 0 0 8px 0;">Amount: <strong>${escapeHtml(payload.amountXOF)} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Transaction Ref: <code>${escapeHtml(payload.transactionId)}</code></p>
            <p style="margin: 0 0 8px 0;">Error Code: <code>${escapeHtml(payload.errorCode)}</code></p>
            <p style="margin: 0;">Description: <strong>${escapeHtml(payload.errorMessage)}</strong></p>
          </div>
          <a href="https://mojaride.com/dashboard/admin/withdrawals" 
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 10px;">
             Manage Withdrawals
          </a>
        </div>
      `;

      return {
        subject: `CRITICAL: Payout failed for ${escapeHtml(payload.companyName)} - ${escapeHtml(payload.amountXOF)} XOF`,
        body: html,
      };
    });
  },
  {
    name: "Admin Operator Payout Failed",
    description: "Alerts admins immediately if a Paystack payout or manual resolution fails",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      adminEmail: z.string().email(),
      transactionId: z.string(),
      companyName: z.string(),
      amountXOF: z.number(),
      errorCode: z.string(),
      errorMessage: z.string(),
    }),
  }
);
