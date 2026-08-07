"use client";

import { cn } from "@moja/ui/lib/utils";
import {
  ADMIN_ROLE_COLORS,
  ADMIN_ROLE_LABELS,
  type AdminStaffRole,
} from "@/features/admin/lib/admin-staff";

export function AdminRoleBadge({ role }: { role: AdminStaffRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        ADMIN_ROLE_COLORS[role],
      )}
    >
      {ADMIN_ROLE_LABELS[role]}
    </span>
  );
}
