import { resolveAppBaseUrl, sendEmail } from "./email-client";

export interface StaffInvitationEmailPayload {
  to: string;
  companyName: string;
  inviterName: string;
  role: string;
  token: string;
  message?: string | null;
  expiresAt: Date;
}

function formatRole(role: string): string {
  const map: Record<string, string> = {
    OWNER: "Owner",
    ADMIN: "Admin",
    MANAGER: "Manager",
    OPERATIONS: "Operations",
    FINANCE: "Finance",
    SUPPORT: "Support",
  };
  return map[role] ?? role;
}

function formatExpiry(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function sendStaffInvitationEmail(
  payload: StaffInvitationEmailPayload,
): Promise<void> {
  const baseUrl = resolveAppBaseUrl();
  const link = `${baseUrl}/invite?token=${payload.token}`;
  const role = formatRole(payload.role);
  const expires = formatExpiry(payload.expiresAt);
  const subject = `${payload.inviterName} invited you to join ${payload.companyName} on Moja Ride`;

  const messageBlock = payload.message
    ? `<p><strong>Message from ${payload.inviterName}:</strong> ${payload.message}</p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="color: #ee237c;">Moja Ride</h2>
      <p><strong>${payload.inviterName}</strong> invited you to join <strong>${payload.companyName}</strong> as <strong>${role}</strong>.</p>
      ${messageBlock}
      <p>This invitation expires on ${expires}.</p>
      <p><a href="${link}" style="display: inline-block; background: #ee237c; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Accept invitation</a></p>
      <p style="color: #666; font-size: 14px;">Or copy this link: ${link}</p>
    </div>
  `;

  const text = [
    `${payload.inviterName} invited you to join ${payload.companyName} on Moja Ride.`,
    `Role: ${role}`,
    payload.message ? `Message: ${payload.message}` : null,
    `Expires: ${expires}`,
    `Accept: ${link}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendEmail({ to: payload.to, subject, html, text });
}
