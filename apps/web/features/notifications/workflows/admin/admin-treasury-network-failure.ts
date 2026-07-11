import { workflow } from "@novu/framework";
import { z } from "zod";

export const adminTreasuryNetworkFailureWorkflow = workflow(
  "admin-treasury-network-failure",
  async ({ step, payload }) => {
    // 1. Email to Platform Admins
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #fca5a5; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ef4444; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Paystack Payout Network Failure</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">An operator payout was successfully committed in the local ledger, but the Paystack Transfer API initiation call failed due to a network or connection error.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #991b1b;">
            <p style="margin: 0 0 8px 0;">Company ID: <strong>${payload.companyId}</strong></p>
            <p style="margin: 0 0 8px 0;">Amount: <strong>${payload.amountXOF} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Ledger Transaction ID: <strong>${payload.transactionId}</strong></p>
            <p style="margin: 0;">Error Details: "<strong>${payload.reason}</strong>"</p>
          </div>
          <p style="font-weight: bold; color: #ef4444; font-size: 15px; line-height: 1.5;">Manual treasury reconciliation is required immediately to verify if the bank payout needs to be manually triggered or reversed.</p>
        </div>
      `;

      return {
        subject: `🚨 CRITICAL: Payout Network Failure - ${payload.amountXOF} XOF`,
        body: html,
      };
    });

    // 2. In-App Notification (High severity)
    await step.inApp("send-in-app", async () => ({
      subject: "Payout Network Failure",
      body: `Ledger Tx ${payload.transactionId} posted but Paystack API failed: ${payload.reason}.`,
      avatar: "https://avatar.vercel.sh/treasury-failure",
      redirect: { url: `/dashboard/admin/settlements`, target: "_self" },
    }));

    // 3. Slack chat channel fan-out alert
    await step.chat("send-slack", async () => ({
      body: `🚨 *Treasury Payout Network Failure* 🚨\nCompany ID: *${payload.companyId}*\nAmount: *${payload.amountXOF} XOF*\nLedger TxID: \`${payload.transactionId}\`\nReason: *${payload.reason}*`,
    }));
  },
  {
    name: "Admin Treasury Network Failure Alert",
    description: "Alerts platform admins via email, in-app feed, and Slack when Paystack payout transfer initiation fails",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      companyId: z.string(),
      amountXOF: z.number(),
      transactionId: z.string(),
      reason: z.string(),
    }),
  }
);
