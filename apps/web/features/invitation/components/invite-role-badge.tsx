"use client";

import { useTranslations } from "next-intl";
import { cn } from "@moja/ui/lib/utils";
import { type StaffRole, ROLE_LABELS, ROLE_COLORS } from "@/features/operator/lib/staff";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface InviteRoleBadgeProps {
  role: StaffRole;
  className?: string;
}

export function InviteRoleBadge({ role, className }: InviteRoleBadgeProps) {
  const t = useTranslations("common.roles");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-0.5 text-[12px] font-semibold",
        ROLE_COLORS[role],
        className,
      )}
    >
      {t.has(role) ? t(role) : ROLE_LABELS[role]}
    </span>
  );
}
