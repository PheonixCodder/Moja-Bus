import { workflow } from "@novu/framework";
import { z } from "zod";

export const operatorStaffInviteWorkflow = workflow(
  "operator-staff-invite",
  async ({ step, payload }) => {
    await step.email("send-email", async () => {
      const messageBlock = payload.message
        ? `<div style="background: #f8fafc; border-left: 4px solid #ee237c; padding: 12px; margin: 16px 0; font-size: 14px; color: #475569; font-style: italic;">
             "${payload.message}"
           </div>`
        : "";

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ee237c; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Moja Ride</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">
            <strong>${payload.inviterName}</strong> has invited you to join <strong>${payload.companyName}</strong> as <strong>${payload.role}</strong>.
          </p>
          ${messageBlock}
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">This invitation expires on ${payload.expiresAt}.</p>
          
          <a href="${payload.inviteUrl}" 
             style="display: inline-block; background: #ee237c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 16px 0; text-align: center;">
             Accept Invitation
          </a>
          
          <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
            If the button doesn't work, copy and paste this link into your browser: <br />
            <a href="${payload.inviteUrl}" style="color: #ee237c; word-break: break-all;">${payload.inviteUrl}</a>
          </p>
        </div>
      `;

      return {
        subject: `${payload.inviterName} invited you to join ${payload.companyName} on Moja Ride`,
        body: html,
      };
    });
  },
  {
    name: "Operator Staff Invitation",
    description: "Invites a new staff member to join a company on Moja Ride",
    payloadSchema: z.object({
      email: z.string().email(),
      companyName: z.string(),
      inviterName: z.string(),
      role: z.string(),
      inviteUrl: z.string().url(),
      expiresAt: z.string(),
      message: z.string().nullable().optional(),
    }),
  }
);
