"use client";

import { cn } from "@moja/ui/lib/utils";
import {
  ROLE_LABELS,
  ROLE_COLORS,
  type StaffRole,
} from "@/features/operator/lib/staff";

export function RoleBadge({ role }: { role: StaffRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        ROLE_COLORS[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
