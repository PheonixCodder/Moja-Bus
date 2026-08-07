import {
  ADMIN_PERMISSION_META,
  ADMIN_ROLE_TEMPLATES,
  type AdminPermissionKey,
  type AdminStaffRole,
  type AdminStaffStatus,
  getAdminPermissionsByGroup,
  getAdminTemplatePermissions,
} from "@moja/schemas";

export {
  ADMIN_PERMISSION_META,
  ADMIN_ROLE_TEMPLATES,
  type AdminPermissionKey,
  type AdminStaffRole,
  type AdminStaffStatus,
  getAdminPermissionsByGroup,
  getAdminTemplatePermissions,
};

export const ADMIN_ROLE_LABELS: Record<AdminStaffRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  OPERATIONS: "Operations",
  SUPPORT: "Support",
  COMPLIANCE: "Compliance",
  FINANCE: "Finance",
};

export const ADMIN_ROLE_COLORS: Record<AdminStaffRole, string> = {
  SUPER_ADMIN: "bg-red-500/15 text-red-600 border-red-500/30",
  ADMIN: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  OPERATIONS: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  SUPPORT: "bg-green-500/15 text-green-600 border-green-500/30",
  COMPLIANCE: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  FINANCE: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

export const ADMIN_ROLE_BADGE_CLASSES = ADMIN_ROLE_COLORS;

export const ADMIN_STATUS_CONFIG: Record<
  AdminStaffStatus,
  { label: string; className: string; icon: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "text-emerald-700",
    icon: "●",
  },
  INACTIVE: {
    label: "Inactive",
    className: "text-slate-600",
    icon: "○",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "text-red-700",
    icon: "⊘",
  },
};

export type AdminStaffMember = {
  id: string;
  profilePhotoUrl?: string | null;
  role: AdminStaffRole;
  status: AdminStaffStatus;
  jobTitle: string | null;
  department?: string | null;
  isActive: boolean;
  joinedAt: Date | string;
  permissions: string[];
  canModify: boolean;
  lastLoginAt?: Date | string | null;
  user: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    image: string | null;
  };
};

export type AdminStaffInvitation = {
  id: string;
  email: string;
  role: AdminStaffRole;
  permissions: string[];
  jobTitle: string | null;
  message: string | null;
  status: string;
  expiresAt: Date | string;
  isExpired?: boolean;
  daysUntilExpiry?: number | null;
  invitedBy: { fullName: string | null; email?: string };
  acceptedBy?: { fullName: string | null; email?: string } | null;
};

export type AdminActivityLogEntry = {
  id: string;
  action: string;
  description: string;
  createdAt: Date | string;
  metadata?: unknown;
  parsedMetadata?: Record<string, unknown> | null;
  targetUserId?: string | null;
  user: {
    fullName: string | null;
    image: string | null;
    email?: string;
  };
};

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-600",
  "bg-emerald-600",
  "bg-cyan-600",
  "bg-blue-600",
  "bg-violet-600",
];

export function getAvatarColor(name: string | null | undefined): string {
  const s = name ?? "";
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash + s.charCodeAt(i) * 17) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash] ?? "bg-slate-500";
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatInvitationExpiry(expiresAt: Date | string): {
  label: string;
  expired: boolean;
} {
  const d = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const expired = d.getTime() < Date.now();
  if (expired) {
    return {
      expired: true,
      label: `Expired ${d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`,
    };
  }
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return {
    expired: false,
    label:
      days <= 1
        ? `Expires ${d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : `Expires in ${days} days`,
  };
}
