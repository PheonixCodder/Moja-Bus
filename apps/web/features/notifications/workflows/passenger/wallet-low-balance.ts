import { workflow } from "@novu/framework";
import { z } from "zod";

export const passengerWalletLowBalanceWorkflow = workflow(
  "passenger-wallet-low-balance",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Insufficient Balance",
      body: `Insufficient Wallet Balance! Your booking requires ${payload.requiredAmountXOF} XOF. You only have ${payload.availableBalanceXOF} XOF.`,
      avatar: "https://avatar.vercel.sh/low-balance",
      redirect: { url: "/dashboard/wallet", target: "_self" },
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
