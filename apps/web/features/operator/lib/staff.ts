// Pure type definitions, role constants, and formatting helpers.
// All data-fetching is done through tRPC (see apps/web/trpc/routers/staff.ts
// and apps/web/trpc/routers/invitation.ts).

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type StaffRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "OPERATIONS"
  | "FINANCE"
  | "SUPPORT";
export type OperatorStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";

export interface StaffMember {
  id: string;
  userId: string;
  companyId: string;
  role: StaffRole;
  status: OperatorStatus;
  jobTitle: string | null;
  joinedAt: string | Date;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    image: string | null;
    sessions: Array<{ createdAt: string | Date }>;
  };
}

export interface StaffInvitation {
  id: string;
  email: string;
  role: StaffRole;
  jobTitle: string | null;
  message: string | null;
  status: InvitationStatus;
  expiresAt: string | Date;
  createdAt: string | Date;
  invitedBy: { fullName: string };
  acceptedBy: { fullName: string } | null;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  createdAt: string | Date;
  user: { fullName: string; image: string | null };
}

export interface InvitationValidation {
  valid: boolean;
  email: string;
  role: StaffRole;
  jobTitle: string | null;
  message: string | null;
  expiresAt: string;
  company: { id: string; name: string; logoUrl: string | null };
  invitedBy: string;
}

export interface CreateInvitationPayload {
  email: string;
  role: StaffRole;
  jobTitle?: string;
  message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  OPERATIONS: "Operations",
  FINANCE: "Finance",
  SUPPORT: "Support",
};

export const ROLE_COLORS: Record<StaffRole, string> = {
  OWNER: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  ADMIN: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  MANAGER: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  OPERATIONS: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  FINANCE: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  SUPPORT: "bg-slate-500/15 text-slate-600 border-slate-500/30",
};

export const STATUS_CONFIG: Record<
  OperatorStatus,
  { label: string; icon: string; className: string }
> = {
  ACTIVE: { label: "Active", icon: "✓", className: "text-emerald-600" },
  INACTIVE: { label: "Inactive", icon: "⏸", className: "text-amber-600" },
  SUSPENDED: { label: "Suspended", icon: "🚫", className: "text-red-600" },
};

/** Returns initials from a full name — e.g. "Ahmed Diallo" → "AD" */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

/** Returns a deterministic avatar background color from initials */
export function getAvatarColor(name: string): string {
  const colors = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-600",
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-600",
    "bg-sky-600",
    "bg-blue-600",
    "bg-indigo-600",
    "bg-violet-600",
    "bg-purple-600",
    "bg-fuchsia-600",
    "bg-pink-600",
  ];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % colors.length;
  return colors[hash] ?? "bg-slate-600";
}

/** Formats a relative time string — "2 min ago", "Yesterday", "3 days ago" */
export function formatRelativeTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

/** Formats invitation expiry — "Expires Jul 3 · 31h left" or "Expired 2 days ago" */
export function formatInvitationExpiry(expiresAt: string | Date): {
  label: string;
  expired: boolean;
} {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) {
    const daysPast = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));
    const label =
      daysPast === 0
        ? "Expired today"
        : daysPast === 1
          ? "Expired yesterday"
          : `Expired ${daysPast} days ago`;
    return { label, expired: true };
  }

  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const dateLabel = expiry.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return { label: `Expires ${dateLabel} · ${hoursLeft}h left`, expired: false };
}
