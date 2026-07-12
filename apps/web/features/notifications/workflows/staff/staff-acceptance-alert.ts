import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const staffAcceptanceAlertWorkflow = workflow(
  "staff-acceptance-alert",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Invitation Accepted",
      body: `${escapeHtml(payload.staffName)} (${escapeHtml(payload.staffEmail)}) accepted your invitation and joined as ${escapeHtml(payload.role)}.`,
      avatar: "https://avatar.vercel.sh/staff",
      redirect: { url: "/dashboard/operator/staff", target: "_self" },
    }));
  },
  {
    name: "Staff Invitation Accepted Alert",
    description: "Sends an In-App notification to the inviter when a staff member accepts their invitation",
    payloadSchema: z.object({
      staffName: z.string(),
      staffEmail: z.string().email(),
      role: z.string(),
    }),
  }
);
