import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const operatorBankRejectedWorkflow = workflow(
  "operator-bank-rejected",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Bank Account Rejected",
      body: `❌ Bank account validation failed for ${escapeHtml(payload.bankName)} (${escapeHtml(payload.accountNumberHidden)}). Reason: ${escapeHtml(payload.reason)}.`,
      avatar: "https://avatar.vercel.sh/bank-rejected",
      redirect: { url: "/dashboard/operator/settings", target: "_self" },
    }));

    // 2. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #ef4444; border-radius: 12px; padding: 24px; color: #1e293b; background: #fff5f5;">
          <h2 style="color: #ef4444; margin-top: 0; font-size: 20px; font-weight: bold;">Bank Account Verification Failed</h2>
          <p>Hello ${escapeHtml(payload.ownerName)},</p>
          <p>We regret to inform you that your registered bank account for <strong>${escapeHtml(payload.companyName)}</strong> was rejected during verification.</p>
          <div style="background: white; border: 1px solid #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Bank: <strong>${escapeHtml(payload.bankName)}</strong></p>
            <p style="margin: 0 0 8px 0;">Account: <strong>${escapeHtml(payload.accountNumberHidden)}</strong></p>
            <p style="margin: 0; color: #b91c1c;">Reason: <strong>${escapeHtml(payload.reason)}</strong></p>
          </div>
          <p style="font-size: 13px; color: #64748b;">Please double check your account number, bank code, and business name alignment, and submit another account in operator settings.</p>
        </div>
      `;

      return {
        subject: `Bank Account Rejected - ${escapeHtml(payload.companyName)}`,
        body: html,
      };
    });
  },
  {
    name: "Operator Bank Account Rejected",
    description: "Alerts transport operators when their registered bank account is rejected during verification",
    payloadSchema: z.object({
      email: z.string().email(),
      ownerName: z.string(),
      companyName: z.string(),
      bankName: z.string(),
      accountNumberHidden: z.string(),
      reason: z.string(),
    }),
  }
);
