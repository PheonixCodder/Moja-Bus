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
  SUPER_ADMIN: "bg-destructive/15 text-destructive border-destructive/30",
  ADMIN: "bg-primary/15 text-primary border-primary/30",
  OPERATIONS: "bg-primary/10 text-primary border-primary/20",
  SUPPORT: "bg-success/15 text-success border-success/30",
  COMPLIANCE: "bg-warning/15 text-warning border-warning/30",
  FINANCE: "bg-warning/10 text-warning border-warning/20",
};

export const ADMIN_ROLE_BADGE_CLASSES = ADMIN_ROLE_COLORS;

export const ADMIN_STATUS_CONFIG: Record<
  AdminStaffStatus,
  { label: string; className: string; icon: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "text-success",
    icon: "●",
  },
  INACTIVE: {
    label: "Inactive",
    className: "text-muted-foreground",
    icon: "○",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "text-destructive",
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
  "bg-primary text-primary-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-accent text-accent-foreground",
  "bg-muted text-muted-foreground",
  "bg-primary/80 text-primary-foreground",
  "bg-secondary/80 text-secondary-foreground",
];

export function getAvatarColor(name: string | null | undefined): string {
  const s = name ?? "";
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash + s.charCodeAt(i) * 17) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash] ?? "bg-muted text-muted-foreground";
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
