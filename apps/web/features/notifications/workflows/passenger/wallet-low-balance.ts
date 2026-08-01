import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const passengerWalletLowBalanceWorkflow = workflow(
  "passenger-wallet-low-balance",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Insufficient Balance",
      body: `Insufficient Wallet Balance! Your booking requires ${escapeHtml(payload.requiredAmountXOF)} XOF. You only have ${escapeHtml(payload.availableBalanceXOF)} XOF.`,
      avatar: "https://avatar.vercel.sh/low-balance",
      redirect: { url: "/dashboard/wallet", target: "_self" },
    }));

    // 2. Push Notification
    await step.push("send-push", async () => ({
      title: "Low Wallet Balance",
      body: `Insufficient balance! Booking requires ${escapeHtml(payload.requiredAmountXOF)} XOF. You have ${escapeHtml(payload.availableBalanceXOF)} XOF.`,
      data: {
        type: "wallet-low-balance",
        requiredAmountXOF: payload.requiredAmountXOF,
      },
    }));
  },
  {
    name: "Passenger Wallet Low Balance",
    description: "Alerts passenger when a wallet payment check fails due to insufficient available balance",
    payloadSchema: z.object({
      email: z.string().email(),
      passengerName: z.string(),
      availableBalanceXOF: z.number(),
      requiredAmountXOF: z.number(),
    }),
  }
);
