import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const operatorWithdrawalFailedWorkflow = workflow(
  "operator-withdrawal-failed",
  async ({ step, payload }) => {
    // 1. Email Channel
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #fca5a5; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ef4444; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Payout Transfer Failed</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.ownerName)},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">The bank transfer request for <strong>${escapeHtml(payload.companyName)}</strong> failed and has been reversed by the banking network.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #991b1b;">
            <p style="margin: 0 0 8px 0;">Attempted Amount: <strong>${escapeHtml(payload.amountXOF)} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Reason: "<strong>${escapeHtml(payload.reason)}</strong>"</p>
            <p style="margin: 0;">Reconciled Reference: <span style="font-family: monospace;">${escapeHtml(payload.transactionId)}</span></p>
          </div>
          <p style="font-weight: bold; color: #ef4444; font-size: 15px; line-height: 1.5;">No funds were lost. The gross amount has been credited back to your operator available balance.</p>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">Please review your bank credentials at \`/dashboard/operator/settings\` before requesting another payout.</p>
        </div>
      `;

      return {
        subject: "ACTION REQUIRED: Payout transfer failed",
        body: html,
      };
    });

    // 2. In-App Channel (Urgent Severity)
    await step.inApp("send-in-app", async () => ({
      subject: "Payout Failed",
      body: `Payout of ${escapeHtml(payload.amountXOF)} XOF failed: ${escapeHtml(payload.reason)}. Funds restored to balance.`,
      avatar: "https://avatar.vercel.sh/withdrawal-failed",
      redirect: { url: "/dashboard/operator/settings", target: "_self" },
    }));

    // 3. SMS Channel
    if (payload.phone) {
      await step.sms("send-sms", async () => ({
        body: `Moja Ride Payout Failed: Transfer of ${escapeHtml(payload.amountXOF)} XOF failed: ${escapeHtml(payload.reason)}. Funds have been restored to your available balance.`,
      }));
    }
  },
  {
    name: "Operator Payout Failed Alert",
    description: "Sends failed payout transfer alerts immediately returning funds to the operator receivable balance",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      ownerName: z.string(),
      companyName: z.string(),
      amountXOF: z.number(),
      bankName: z.string(),
      accountNumberLast4: z.string(),
      transactionId: z.string(),
      reason: z.string(),
      phone: z.string().optional(),
    }),
  }
);
