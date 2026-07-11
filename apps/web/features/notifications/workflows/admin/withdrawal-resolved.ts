import { workflow } from "@novu/framework";
import { z } from "zod";

export const operatorWithdrawalResolvedWorkflow = workflow(
  "operator-withdrawal-resolved",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: `Withdrawal Status Updated: ${payload.status}`,
      body: `💸 Payout of ${payload.amountXOF} XOF marked as ${payload.status} by platform admin. Note: ${payload.reason}.`,
      avatar: payload.status === "SETTLED" ? "https://avatar.vercel.sh/payout-success" : "https://avatar.vercel.sh/payout-fail",
      redirect: { url: "/dashboard/operator/revenue", target: "_self" },
    }));

    // 2. Email Notification
    await step.email("send-email", async () => {
      const isSettled = payload.status === "SETTLED";
      const color = isSettled ? "#10b981" : "#ef4444";
      const statusLabel = isSettled ? "Settled (Paid)" : "Failed (Cancelled)";

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid ${color}; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: ${color}; margin-top: 0; font-size: 20px; font-weight: bold;">Withdrawal Status Update</h2>
          <p>Hello ${payload.ownerName},</p>
          <p>Your withdrawal request has been resolved by platform administration:</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Company: <strong>${payload.companyName}</strong></p>
            <p style="margin: 0 0 8px 0;">Amount: <strong>${payload.amountXOF} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Status: <strong style="color: ${color};">${statusLabel}</strong></p>
            <p style="margin: 0 0 8px 0;">Transaction Ref: <code>${payload.transactionId}</code></p>
            <p style="margin: 0;">Admin Note: <strong>${payload.reason}</strong></p>
          </div>
          ${isSettled 
            ? `<p>The funds have been credited to your bank account. Depending on your bank, it may take 1-3 business days to reflect.</p>` 
            : `<p style="color: #b91c1c;">The funds have been returned to your operator receivable account. Please verify your bank account details and submit another request.</p>`
          }
        </div>
      `;

      return {
        subject: `Withdrawal status updated: ${payload.status}`,
        body: html,
      };
    });
  },
  {
    name: "Operator Payout Resolved",
    description: "Alerts operators when their withdrawal status is manually resolved (settled or failed) by admins",
    payloadSchema: z.object({
      email: z.string().email(),
      ownerName: z.string(),
      companyName: z.string(),
      transactionId: z.string(),
      amountXOF: z.number(),
      status: z.enum(["SETTLED", "FAILED"]),
      reason: z.string(),
    }),
  }
);
