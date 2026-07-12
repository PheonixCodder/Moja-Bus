import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const passengerWalletTopupWorkflow = workflow(
  "passenger-wallet-topup",
  async ({ step, payload }) => {
    // 1. Email Channel
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #0081F1; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Wallet Top-Up Successful</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(payload.passengerName)}, your wallet deposit has cleared.</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; color: #334155;">
            <p style="margin: 0 0 8px 0;">Deposit Amount: <strong>${escapeHtml(payload.amountXOF)} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Payment Method: <strong>${escapeHtml(payload.paymentMethod)}</strong></p>
            <p style="margin: 0; color: #64748b;">Transaction ID: <span style="font-family: monospace;">${escapeHtml(payload.transactionId)}</span></p>
          </div>
        </div>
      `;

      return {
        subject: `Wallet Deposit Confirmation - ${escapeHtml(payload.amountXOF)} XOF`,
        body: html,
      };
    });

    // 2. In-App Channel
    await step.inApp("send-in-app", async () => ({
      subject: "Wallet Deposited",
      body: `Deposit of ${escapeHtml(payload.amountXOF)} XOF was successful! Funds are available immediately.`,
      avatar: "https://avatar.vercel.sh/wallet",
      redirect: { url: "/dashboard/wallet", target: "_self" },
    }));
  },
  {
    name: "Passenger Wallet Top-Up Successful",
    description: "Sends deposit invoice receipt and topbar success notification",
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      amountXOF: z.number(),
      transactionId: z.string(),
      paymentMethod: z.string(),
    }),
  }
);
