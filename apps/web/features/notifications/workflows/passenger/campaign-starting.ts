import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/** Marketing (not critical) — subscriber preferences / opt-out apply. */
export const passengerCampaignStartingWorkflow = workflow(
  "passenger-campaign-starting",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "New Moja Ride promo",
      body: `${escapeHtml(payload.campaignName)}: ${escapeHtml(payload.benefitSummary)}`,
      redirect: { url: "/", target: "_self" },
    }));

    await step.push("send-push", async () => ({
      subject: "New promo",
      body: `${payload.campaignName} — ${payload.benefitSummary}`,
    }));

    await step.email("send-email", async () => ({
      subject: `Promo: ${payload.campaignName}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #ee237c;">${escapeHtml(payload.campaignName)}</h2>
          <p>${escapeHtml(payload.benefitSummary)}</p>
          <p style="font-size: 12px; color: #64748b;">You received this because you opted into marketing emails. Manage preferences in account settings.</p>
        </div>
      `,
    }));
  },
  {
    name: "Passenger Campaign Starting",
    description:
      "Opt-in marketing blast when a platform campaign launches. Respects subscriber preferences.",
    payloadSchema: z.object({
      campaignId: z.string(),
      campaignName: z.string(),
      benefitSummary: z.string(),
    }),
  },
);
