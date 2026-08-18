import type { PrismaClient } from "@moja/db";
import { getNovuClient } from "@/lib/novu";
import {
  enqueueReferralAttributed,
  enqueueReferralReward,
} from "@/features/notifications/outbox/commercial";
import type { OutboxDb } from "@/features/notifications/outbox/enqueue";

type Subscriber = {
  userId: string;
  email?: string | null | undefined;
  fullName?: string | null | undefined;
};

type OutboxClient = OutboxDb | PrismaClient;

async function triggerSafe(input: {
  workflowId: string;
  to: Subscriber;
  payload: Record<string, unknown>;
  transactionId: string;
}): Promise<void> {
  const novu = getNovuClient();
  if (!novu) return;
  const email = input.to.email?.trim();
  if (!email) return;

  try {
    await novu.trigger({
      workflowId: input.workflowId,
      to: {
        subscriberId: input.to.userId,
        email,
        firstName: input.to.fullName?.split(" ")[0],
      },
      payload: input.payload,
      transactionId: input.transactionId,
    });
  } catch (err) {
    console.error(`Novu trigger failed (${input.workflowId}):`, err);
  }
}

/** Create these workflows in Novu dashboard (IDs must match). */
export const DISCOUNT_NOVU_WORKFLOWS = {
  referralAttributed: "passenger-referral-attributed",
  referralRewardPosted: "passenger-referral-reward",
  campaignPausedOperator: "operator-campaign-paused",
  campaignBudgetExhausted: "campaign-budget-exhausted",
  creditExpiring: "passenger-credit-expiring",
} as const;

/** Prefer outbox when prisma is passed. */
export async function notifyReferralAttributed(input: {
  referrer: Subscriber;
  refereeName?: string | null | undefined;
  edgeId: string;
  prisma?: OutboxClient;
}): Promise<void> {
  const email = input.referrer.email?.trim();
  if (!email) return;

  const data = {
    refereeName: input.refereeName ?? "A traveler",
    edgeId: input.edgeId,
  };

  if (input.prisma) {
    const firstName = input.referrer.fullName?.split(" ")[0];
    await enqueueReferralAttributed(input.prisma, {
      edgeId: input.edgeId,
      email,
      subscriberId: input.referrer.userId,
      ...(firstName ? { firstName } : {}),
      data,
    });
    return;
  }

  void triggerSafe({
    workflowId: DISCOUNT_NOVU_WORKFLOWS.referralAttributed,
    to: input.referrer,
    payload: data,
    transactionId: `ref-attrib-${input.edgeId}`,
  });
}

export async function notifyReferralRewardPosted(input: {
  referrer: Subscriber;
  amountXOF: number;
  creditLotId: string;
  prisma?: OutboxClient;
}): Promise<void> {
  const email = input.referrer.email?.trim();
  if (!email) return;

  const data = {
    amountXOF: input.amountXOF,
    creditLotId: input.creditLotId,
  };

  if (input.prisma) {
    const firstName = input.referrer.fullName?.split(" ")[0];
    await enqueueReferralReward(input.prisma, {
      creditLotId: input.creditLotId,
      email,
      subscriberId: input.referrer.userId,
      ...(firstName ? { firstName } : {}),
      data,
    });
    return;
  }

  void triggerSafe({
    workflowId: DISCOUNT_NOVU_WORKFLOWS.referralRewardPosted,
    to: input.referrer,
    payload: data,
    transactionId: `referral-reward-${input.creditLotId}`,
  });
}

export function notifyOperatorCampaignPaused(input: {
  operatorUsers: Subscriber[];
  campaignId: string;
  campaignName: string;
  reason: string;
}): void {
  for (const user of input.operatorUsers) {
    void triggerSafe({
      workflowId: DISCOUNT_NOVU_WORKFLOWS.campaignPausedOperator,
      to: user,
      payload: {
        campaignId: input.campaignId,
        campaignName: input.campaignName,
        reason: input.reason,
      },
      transactionId: `campaign-paused-${input.campaignId}-${user.userId}`,
    });
  }
}

export function notifyCampaignBudgetExhausted(input: {
  recipients: Subscriber[];
  campaignId: string;
  campaignName: string;
  budgetXOF: number;
}): void {
  for (const recipient of input.recipients) {
    void triggerSafe({
      workflowId: DISCOUNT_NOVU_WORKFLOWS.campaignBudgetExhausted,
      to: recipient,
      payload: {
        campaignId: input.campaignId,
        campaignName: input.campaignName,
        budgetXOF: input.budgetXOF,
      },
      transactionId: `campaign-budget-${input.campaignId}-${recipient.userId}`,
    });
  }
}

export function notifyCreditExpiring(input: {
  user: Subscriber;
  creditLotId: string;
  amountXOF: number;
  expiresAt: Date;
}): void {
  void triggerSafe({
    workflowId: DISCOUNT_NOVU_WORKFLOWS.creditExpiring,
    to: input.user,
    payload: {
      creditLotId: input.creditLotId,
      amountXOF: input.amountXOF,
      expiresAt: input.expiresAt.toISOString(),
    },
    transactionId: `credit-expiring-${input.creditLotId}-${input.expiresAt.toISOString().slice(0, 10)}`,
  });
}
