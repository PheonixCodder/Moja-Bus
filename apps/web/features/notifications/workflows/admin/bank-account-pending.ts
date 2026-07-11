import { workflow } from "@novu/framework";
import { z } from "zod";

export const adminBankAccountPendingWorkflow = workflow(
  "admin-bank-account-pending",
  async ({ step, payload }) => {
    // 1. In-App Notification for admins
    await step.inApp("send-in-app", async () => ({
      subject: "Bank Account Pending Verification",
      body: `🏦 Bank account verification requested by ${payload.companyName} (${payload.bankName} - ${payload.accountNumberHidden}).`,
      avatar: "https://avatar.vercel.sh/bank-pending",
      redirect: { url: "/dashboard/admin/verification", target: "_self" },
    }));
  },
  {
    name: "Admin Bank Account Pending",
    description: "Alerts admins when an operator registers a new bank account requiring platform verification",
    payloadSchema: z.object({
      adminEmail: z.string().email(),
      companyName: z.string(),
      bankName: z.string(),
      accountName: z.string(),
      accountNumberHidden: z.string(),
      bankAccountId: z.string(),
    }),
  }
);
