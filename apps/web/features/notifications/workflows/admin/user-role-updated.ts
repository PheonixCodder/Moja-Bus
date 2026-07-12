import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const userRoleUpdatedWorkflow = workflow(
  "user-role-updated",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Account Privilege Changed",
      body: `🔑 Security: Your account privilege has been updated to ${escapeHtml(payload.newRole)}. Log out and log back in to apply.`,
      avatar: "https://avatar.vercel.sh/role-changed",
      redirect: { url: "/dashboard", target: "_self" },
    }));

    // 2. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #6366f1; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #6366f1; margin-top: 0; font-size: 20px; font-weight: bold;">Security: Account Privilege Updated</h2>
          <p>Hello ${escapeHtml(payload.userName)},</p>
          <p>This is a security alert to notify you that your user role on Moja Ride has been modified by the platform administrators.</p>
          <div style="background: #f5f3ff; border: 1px solid #ddd6fe; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; text-align: center; color: #5b21b6;">
            New Platform Role: <strong>${escapeHtml(payload.newRole)}</strong>
          </div>
          <p>Please log out of your current session and sign back in to refresh your dashboard privileges and permissions.</p>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">If you did not expect this adjustment, please contact support.</p>
        </div>
      `;

      return {
        subject: `Security Alert: Your Moja Ride role has changed`,
        body: html,
      };
    });
  },
  {
    name: "User Privilege Updated",
    description: "Alerts users and security logs immediately when user roles are updated by admins",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      userName: z.string(),
      newRole: z.enum(["TRAVELER", "OPERATOR", "ADMIN"]),
    }),
  }
);
