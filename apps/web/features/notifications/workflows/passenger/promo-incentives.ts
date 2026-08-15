import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

export const passengerVoucherIssuedWorkflow = workflow(
  "passenger-voucher-issued",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Voucher added",
      body: `You received a ${escapeHtml(payload.amountXOF)} XOF voucher (${escapeHtml(payload.source)}).`,
      redirect: { url: "/dashboard/wallet", target: "_self" },
    }));

    await step.email("send-email", async () => ({
      subject: `Your Moja Ride voucher — ${payload.amountXOF} XOF`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #ee237c;">Voucher issued</h2>
          <p>A ${escapeHtml(payload.amountXOF)} XOF voucher was added to your account (source: ${escapeHtml(payload.source)}).</p>
          ${payload.expiresAt ? `<p>Expires: ${escapeHtml(payload.expiresAt)}</p>` : ""}
        </div>
      `,
    }));

    await step.push("send-push", async () => ({
      subject: "Voucher added",
      body: `${payload.amountXOF} XOF voucher ready to use on Moja Ride.`,
    }));
  },
  {
    name: "Passenger Voucher Issued",
    description: "Transactional notice when a monetary voucher is issued",
    preferences: { all: { readOnly: true } },
    payloadSchema: z.object({
      amountXOF: z.number(),
      voucherId: z.string(),
      source: z.string(),
      expiresAt: z.string().nullable().optional(),
    }),
  },
);

export const passengerReferralAttributedWorkflow = workflow(
  "passenger-referral-attributed",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Referral signed up",
      body: `${escapeHtml(payload.refereeName)} used your invite. Rewards unlock after their paid trip.`,
      redirect: { url: "/dashboard/referrals", target: "_self" },
    }));
  },
  {
    name: "Passenger Referral Attributed",
    description: "In-app notice when a referee applies a referral code",
    payloadSchema: z.object({
      refereeName: z.string(),
      edgeId: z.string(),
    }),
  },
);

export const passengerReferralRewardWorkflow = workflow(
  "passenger-referral-reward",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Referral reward posted",
      body: `${escapeHtml(payload.amountXOF)} XOF promo credit was added to your account.`,
      redirect: { url: "/dashboard/referrals", target: "_self" },
    }));

    await step.email("send-email", async () => ({
      subject: `Referral reward — ${payload.amountXOF} XOF`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #ee237c;">Referral reward</h2>
          <p>${escapeHtml(payload.amountXOF)} XOF promo credit is now available at checkout.</p>
        </div>
      `,
    }));

    await step.push("send-push", async () => ({
      subject: "Referral reward",
      body: `${payload.amountXOF} XOF credit added from your referral.`,
    }));
  },
  {
    name: "Passenger Referral Reward",
    description: "Notice when a referral credit lot becomes available",
    preferences: { all: { readOnly: true } },
    payloadSchema: z.object({
      amountXOF: z.number(),
      creditLotId: z.string(),
    }),
  },
);

export const passengerVoucherExpiringWorkflow = workflow(
  "passenger-voucher-expiring",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Voucher expiring soon",
      body: `Your ${escapeHtml(payload.amountXOF)} XOF voucher expires on ${escapeHtml(payload.expiresAt)}.`,
      redirect: { url: "/dashboard/wallet", target: "_self" },
    }));

    await step.push("send-push", async () => ({
      subject: "Voucher expiring",
      body: `${payload.amountXOF} XOF voucher expires ${payload.expiresAt}.`,
    }));
  },
  {
    name: "Passenger Voucher Expiring",
    description: "Reminder ~7 days before voucher expiry",
    payloadSchema: z.object({
      voucherId: z.string(),
      amountXOF: z.number(),
      expiresAt: z.string(),
    }),
  },
);

export const passengerCreditExpiringWorkflow = workflow(
  "passenger-credit-expiring",
  async ({ step, payload }) => {
    await step.push("send-push", async () => ({
      subject: "Promo credit expiring",
      body: `${payload.amountXOF} XOF credit expires ${payload.expiresAt}.`,
    }));
  },
  {
    name: "Passenger Credit Expiring",
    description: "Push reminder before promo credit expiry",
    payloadSchema: z.object({
      creditLotId: z.string(),
      amountXOF: z.number(),
      expiresAt: z.string(),
    }),
  },
);
