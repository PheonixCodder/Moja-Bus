import {
  PERMISSION_META,
  ROLE_TEMPLATES,
  getPermissionsByGroup,
  getTemplatePermissions,
  type PermissionKey,
  type StaffRole,
} from "@moja/schemas";

export {
  PERMISSION_META,
  ROLE_TEMPLATES,
  getPermissionsByGroup,
  getTemplatePermissions,
  type PermissionKey,
  type StaffRole,
};

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
  OPERATIONS: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  FINANCE: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
  SUPPORT: "bg-slate-500/15 text-slate-600 border-slate-500/30",
};

export const ROLE_BADGE_CLASSES = ROLE_COLORS;

export const STATUS_CONFIG = {
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
} as const;

export type OperatorStatus = keyof typeof STATUS_CONFIG;

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

export type StaffMember = {
  id: string;
  profilePhotoUrl?: string | null;
  role: StaffRole;
  status: OperatorStatus;
  jobTitle: string | null;
  isVerified: boolean;
  isActive: boolean;
  joinedAt: Date | string;
  permissions: string[];
  canModify: boolean;
  personalPhone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  nationalIdNumber?: string | null;
  nationalIdType?: string | null;
  dateOfBirth?: Date | string | null;
  lastLoginAt?: Date | string | null;
  user: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    image: string | null;
  };
};

export type StaffInvitation = {
  id: string;
  email: string;
  role: StaffRole;
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

export type ActivityLogEntry = {
  id: string;
  action: string;
  description: string;
  createdAt: Date | string;
  metadata?: string | null;
  parsedMetadata?: Record<string, unknown> | null;
  user: {
    fullName: string | null;
    image: string | null;
    email?: string;
  };
};

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
