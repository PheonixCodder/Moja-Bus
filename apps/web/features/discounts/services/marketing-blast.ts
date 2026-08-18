import type { PrismaClient } from "@moja/db";
import { getNovuClient } from "@/lib/novu";

const WORKFLOW_ID = "passenger-campaign-starting";
const BATCH = 50;

/**
 * Marketing blast: only passengers with marketingOptIn=true.
 * Transactional promo/referral workflows must NOT use this path.
 */
export async function notifyOptedInCampaignStarting(
  prisma: PrismaClient,
  input: {
    campaignId: string;
    campaignName: string;
    benefitSummary: string;
    limit?: number | undefined;
  },
): Promise<{ attempted: number; skippedNoNovu: boolean }> {
  const novu = getNovuClient();
  if (!novu) {
    return { attempted: 0, skippedNoNovu: true };
  }

  const profiles = await prisma.passengerProfile.findMany({
    where: { marketingOptIn: true },
    take: input.limit ?? 500,
    select: {
      userId: true,
      user: { select: { id: true, email: true, fullName: true } },
    },
  });

  let attempted = 0;
  for (let i = 0; i < profiles.length; i += BATCH) {
    const chunk = profiles.slice(i, i + BATCH);
    await Promise.all(
      chunk.map(async (row) => {
        const email = row.user.email?.trim();
        if (!email) return;
        attempted++;
        try {
          await novu.trigger({
            workflowId: WORKFLOW_ID,
            to: {
              subscriberId: row.user.id,
              email,
              firstName: row.user.fullName?.split(" ")[0],
            },
            payload: {
              campaignId: input.campaignId,
              campaignName: input.campaignName,
              benefitSummary: input.benefitSummary,
            },
            transactionId: `campaign-start-${input.campaignId}-${row.user.id}`,
          });
        } catch (err) {
          console.error("Campaign start Novu trigger failed:", err);
        }
      }),
    );
  }

  return { attempted, skippedNoNovu: false };
}
