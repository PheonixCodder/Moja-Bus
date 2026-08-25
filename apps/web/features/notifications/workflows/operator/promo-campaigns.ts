import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/** Phase 34 (F-NF-12) — exported for the enqueue↔payloadSchema contract harness. */
export const operatorCampaignPausedPayloadSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),
  pauseReason: z.string().nullable().optional(),
});

export const operatorCampaignPausedWorkflow = workflow(
  "operator-campaign-paused",
  async ({ step, payload }) => {
    await step.email("send-email", async () => ({
      subject: `Campaign paused — ${payload.campaignName}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2>Campaign paused by Moja Ride</h2>
          <p>Your promotion <strong>${escapeHtml(payload.campaignName)}</strong> was paused.</p>
          ${payload.pauseReason ? `<p>Reason: ${escapeHtml(payload.pauseReason)}</p>` : ""}
          <p>Review it in the operator promotions dashboard.</p>
        </div>
      `,
    }));
  },
  {
    name: "Operator Campaign Paused",
    description: "Email operator owners when admin pauses their campaign",
    preferences: { all: { readOnly: true } },
    payloadSchema: operatorCampaignPausedPayloadSchema,
  },
);

export const campaignBudgetExhaustedWorkflow = workflow(
  "campaign-budget-exhausted",
  async ({ step, payload }) => {
    await step.email("send-email", async () => ({
      subject: `Budget exhausted — ${payload.campaignName}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2>Campaign budget exhausted</h2>
          <p><strong>${escapeHtml(payload.campaignName)}</strong> has reached its budget of ${escapeHtml(payload.budgetXOF)} XOF.</p>
          <p>New redemptions will be rejected until you raise the budget or pause the campaign.</p>
        </div>
      `,
    }));
  },
  {
    name: "Campaign Budget Exhausted",
    description: "Email campaign creators when budget is fully consumed",
    preferences: { all: { readOnly: true } },
    payloadSchema: z.object({
      campaignId: z.string(),
      campaignName: z.string(),
      budgetXOF: z.number(),
    }),
  },
);
