"use client";

import { cn } from "@moja/ui/lib/utils";
import type { TripStatus } from "@moja/schemas";
import { TRIP_STATUS_CONFIG } from "@/features/operator/lib/trips/status-config";

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const cfg = TRIP_STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold",
        cfg.color,
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}
