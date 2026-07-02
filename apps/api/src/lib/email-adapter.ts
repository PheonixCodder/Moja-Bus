// ─────────────────────────────────────────────────────────────────────────────
// EMAIL ADAPTER — Mock implementation for development.
// Swap send() to a real provider (Resend, SendGrid) in production.
// ─────────────────────────────────────────────────────────────────────────────

export interface StaffInvitationEmailPayload {
  to: string;
  companyName: string;
  inviterName: string;
  role: string;
  token: string;
  message?: string | null;
  expiresAt: Date;
  baseUrl?: string;
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

export const emailAdapter = {
  async sendStaffInvitation(
    payload: StaffInvitationEmailPayload,
  ): Promise<void> {
    const baseUrl =
      payload.baseUrl ?? process.env["WEB_BASE_URL"] ?? "http://localhost:3000";
    const link = `${baseUrl}/invite?token=${payload.token}`;
    const role = formatRole(payload.role);
    const expires = formatExpiry(payload.expiresAt);

    // In development — emit a structured log so the link is easily accessible
    console.log(
      [
        "",
        "╔══════════════════════════════════════════════════════════════╗",
        "║  [EMAIL MOCK] Staff Invitation                              ║",
        "╠══════════════════════════════════════════════════════════════╣",
        `║  To:      ${payload.to.padEnd(50)}║`,
        `║  Subject: ${`${payload.inviterName} invited you to join ${payload.companyName}`.slice(0, 50).padEnd(50)}║`,
        `║  Role:    ${role.padEnd(50)}║`,
        payload.message
          ? `║  Message: ${payload.message.slice(0, 50).padEnd(50)}║`
          : null,
        `║  Expires: ${expires.padEnd(50)}║`,
        "╠══════════════════════════════════════════════════════════════╣",
        `║  Link: ${link.slice(0, 54).padEnd(54)}║`,
        "╚══════════════════════════════════════════════════════════════╝",
        "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    // TODO (production): replace body below with real email provider
    // await resend.emails.send({
    //   from: "noreply@mojaride.com",
    //   to: payload.to,
    //   subject: `${payload.inviterName} invited you to join ${payload.companyName} on Moja Ride`,
    //   html: renderStaffInviteEmail({ link, role, companyName, inviterName, message }),
    // });
  },
};
