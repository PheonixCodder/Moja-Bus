import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const operatorWithdrawalSettledWorkflow = workflow(
  "operator-withdrawal-settled",
  async ({ step, payload }) => {
    // 1. Email Channel
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #10b981; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Withdrawal Settled</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.ownerName)},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">The bank transfer for <strong>${escapeHtml(payload.companyName)}</strong> has cleared successfully:</p>
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #065f46;">
            <p style="margin: 0 0 8px 0;">Amount: <strong>${escapeHtml(payload.amountXOF)} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Bank: <strong>${escapeHtml(payload.bankName)} (****${escapeHtml(payload.accountNumberLast4)})</strong></p>
            <p style="margin: 0;">Settled At: <strong>${escapeHtml(payload.settledAt)}</strong></p>
          </div>
        </div>
      `;

      return {
        subject: `Withdrawal settled successfully: ${escapeHtml(payload.amountXOF)} XOF`,
        body: html,
      };
    });

    // 2. In-App Channel
    await step.inApp("send-in-app", async () => ({
      subject: "Withdrawal Settled",
      body: `Withdrawal of ${escapeHtml(payload.amountXOF)} XOF to bank has cleared successfully.`,
      avatar: "https://avatar.vercel.sh/withdrawal-success",
      redirect: { url: "/dashboard/operator/revenue", target: "_self" },
    }));

    // 3. SMS Channel
    await step.sms("send-sms", async () => ({
      body: `Moja Ride Payout: Payout of ${escapeHtml(payload.amountXOF)} XOF to your verified bank account has settled successfully.`,
    }), {
      skip: () => !payload.phone,
    });
  },
  {
    name: "Operator Withdrawal Settled",
    description: "Sends successful transfer notifications (email, in-app, and SMS) when the bank payout clears",
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
      settledAt: z.string(),
      phone: z.string().optional(),
    }),
  }
);
