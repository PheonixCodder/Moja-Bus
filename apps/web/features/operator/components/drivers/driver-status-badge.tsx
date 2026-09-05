"use client";

import { cn } from "@moja/ui/lib/utils";
import type { DriverStatus } from "@moja/schemas";

interface DriverStatusBadgeProps {
  status: DriverStatus | string;
  className?: string;
}

interface StatusConfigItem {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  AVAILABLE: {
    label: "Available",
    bg: "bg-success/10 border-success/20",
    text: "text-success",
    dot: "bg-success animate-pulse",
  },
  ON_DUTY: {
    label: "On Duty",
    bg: "bg-primary/10 border-primary/20",
    text: "text-primary",
    dot: "bg-primary animate-pulse",
  },
  ON_TRIP: {
    label: "On Trip",
    bg: "bg-primary/10 border-primary/20",
    text: "text-primary",
    dot: "bg-primary animate-ping",
  },
  RESTING: {
    label: "Resting",
    bg: "bg-warning/10 border-warning/20",
    text: "text-warning",
    dot: "bg-warning",
  },
  SUSPENDED: {
    label: "Suspended",
    bg: "bg-destructive/10 border-destructive/20",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  OFFLINE: {
    label: "Offline",
    bg: "bg-muted border-border",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

const DEFAULT_CONFIG: StatusConfigItem = {
  label: "Offline",
  bg: "bg-muted border-border",
  text: "text-muted-foreground",
  dot: "bg-muted-foreground",
};

export function DriverStatusBadge({
  status,
  className,
}: DriverStatusBadgeProps) {
  const config =
    (typeof status === "string" && STATUS_CONFIG[status]) || DEFAULT_CONFIG;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}
