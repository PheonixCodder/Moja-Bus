"use client";

import { cn } from "@moja/ui/lib/utils";
import {
  STATUS_CONFIG,
  type OperatorStatus,
} from "@/features/operator/lib/staff";

export function StatusBadge({ status }: { status: OperatorStatus }) {
  const config = STATUS_CONFIG[status];
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
