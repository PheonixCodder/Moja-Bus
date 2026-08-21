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
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500 animate-pulse",
  },
  ON_DUTY: {
    label: "On Duty",
    bg: "bg-blue-500/10 border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500 animate-pulse",
  },
  ON_TRIP: {
    label: "On Trip",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500 animate-ping",
  },
  RESTING: {
    label: "Resting",
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  SUSPENDED: {
    label: "Suspended",
    bg: "bg-rose-500/10 border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  OFFLINE: {
    label: "Offline",
    bg: "bg-zinc-500/10 border-zinc-500/20",
    text: "text-zinc-600 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
};

const DEFAULT_CONFIG: StatusConfigItem = {
  label: "Offline",
  bg: "bg-zinc-500/10 border-zinc-500/20",
  text: "text-zinc-600 dark:text-zinc-400",
  dot: "bg-zinc-400",
};

export function DriverStatusBadge({ status, className }: DriverStatusBadgeProps) {
  const config = (typeof status === "string" && STATUS_CONFIG[status]) || DEFAULT_CONFIG;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}
