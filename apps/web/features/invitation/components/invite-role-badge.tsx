"use client";

import { cn } from "@moja/ui/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types (inline — no external type dependency)
// ─────────────────────────────────────────────────────────────────────────────

type StaffRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "OPERATIONS"
  | "FINANCE"
  | "SUPPORT";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  OPERATIONS: "Operations",
  FINANCE: "Finance",
  SUPPORT: "Support",
};

const ROLE_COLORS: Record<StaffRole, string> = {
  OWNER: "bg-amber-500/15 text-amber-700 border-amber-300",
  ADMIN: "bg-purple-500/15 text-purple-700 border-purple-300",
  MANAGER: "bg-blue-500/15 text-blue-700 border-blue-300",
  OPERATIONS: "bg-sky-500/15 text-sky-700 border-sky-300",
  FINANCE: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  SUPPORT: "bg-slate-500/15 text-slate-700 border-slate-300",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface InviteRoleBadgeProps {
  role: StaffRole;
  className?: string;
}

export function InviteRoleBadge({ role, className }: InviteRoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-0.5 text-[12px] font-semibold",
        ROLE_COLORS[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
