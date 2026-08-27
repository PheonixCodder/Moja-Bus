import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

export const adminStaffInviteWorkflow = workflow(
  "admin-staff-invite",
  async ({ step, payload }) => {
    await step.email("send-email", async () => {
      const messageBlock = payload.message
        ? `<div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 12px; margin: 16px 0; font-size: 14px; color: #475569; font-style: italic;">
             "${escapeHtml(payload.message)}"
           </div>`
        : "";

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #6366f1; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Moja Admin</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">
            <strong>${escapeHtml(payload.inviterName)}</strong> has invited you to join the <strong>Moja Ride platform administration</strong> team as <strong>${escapeHtml(payload.role)}</strong>${payload.jobTitle ? ` (${escapeHtml(payload.jobTitle)})` : ""}.
          </p>
          ${messageBlock}
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">This invitation expires on ${escapeHtml(payload.expiresAt)}.</p>

          <a href="${escapeHtml(payload.inviteUrl)}"
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 16px 0; text-align: center;">
             Accept Invitation
          </a>

          <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
            If the button doesn't work, copy and paste this link into your browser: <br />
            <a href="${escapeHtml(payload.inviteUrl)}" style="color: #6366f1; word-break: break-all;">${escapeHtml(payload.inviteUrl)}</a>
          </p>
        </div>
      `;

      return {
        subject: `${escapeHtml(payload.inviterName)} invited you to join the Moja Ride admin team`,
        body: html,
      };
    });
  },
  {
    name: "Admin Staff Invitation",
    description:
      "Invites a new platform administrator to join the Moja Ride admin team",
    payloadSchema: z.object({
      email: z.string().email(),
      inviterName: z.string(),
      role: z.string(),
      jobTitle: z.string().nullable().optional(),
      inviteUrl: z.string().url(),
      expiresAt: z.string(),
      message: z.string().nullable().optional(),
    }),
  },
);
