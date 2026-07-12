import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const operatorWithdrawalRequestedWorkflow = workflow(
  "operator-withdrawal-requested",
  async ({ step, payload }) => {
    // 1. Email Channel
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ee237c; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Withdrawal Initiated</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.ownerName)},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">We have initiated a payout request for <strong>${escapeHtml(payload.companyName)}</strong> to your default bank account:</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; color: #334155; border: 1px solid #f1f5f9;">
            <p style="margin: 0 0 8px 0;">Payout Amount: <strong>${escapeHtml(payload.amountXOF)} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Destination Bank: <strong>${escapeHtml(payload.bankName)} (****${escapeHtml(payload.accountNumberLast4)})</strong></p>
            <p style="margin: 0; color: #64748b;">Transaction Reference: <span style="font-family: monospace;">${escapeHtml(payload.transactionId)}</span></p>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">Most transfers clear within minutes, but some banks may take up to 24 hours. We will notify you once Paystack confirms completion.</p>
        </div>
      `;

      return {
        subject: `Withdrawal request initiated: ${escapeHtml(payload.amountXOF)} XOF`,
        body: html,
      };
    });

    // 2. In-App Channel
    await step.inApp("send-in-app", async () => ({
      subject: "Withdrawal Requested",
      body: `Withdrawal request for ${escapeHtml(payload.amountXOF)} XOF sent to ${escapeHtml(payload.bankName)}.`,
      avatar: "https://avatar.vercel.sh/withdrawal",
      redirect: { url: "/dashboard/operator/revenue", target: "_self" },
    }));
  },
  {
    name: "Operator Withdrawal Requested",
    description: "Confirms that an operator payout withdrawal request was successfully generated and sent to Paystack",
    payloadSchema: z.object({
      email: z.string().email(),
      ownerName: z.string(),
      companyName: z.string(),
      amountXOF: z.number(),
      bankName: z.string(),
      accountNumberLast4: z.string(),
      transactionId: z.string(),
    }),
  }
);
