"use client";

import { cn } from "@moja/ui/lib/utils";
import {
  ADMIN_STATUS_CONFIG,
  type AdminStaffStatus,
} from "@/features/admin/lib/admin-staff";

export function AdminStatusBadge({ status }: { status: AdminStaffStatus }) {
  const config = ADMIN_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[12px] font-medium",
        config.className,
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
