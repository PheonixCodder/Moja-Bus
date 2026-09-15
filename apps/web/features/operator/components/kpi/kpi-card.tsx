"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { cn } from "@moja/ui/lib/utils";

export type KpiStatusColor =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "primary"
  | "muted";

export type KpiTrend = {
  value: string | number;
  direction?: "up" | "down" | "neutral";
  label?: string;
};

export interface KpiCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  subtext?: React.ReactNode | undefined;
  /** Backwards compatibility alias for subtext */
  sub?: React.ReactNode | undefined;
  icon?: React.ElementType | undefined;
  iconClassName?: string | undefined;
  iconContainerClassName?: string | undefined;
  variant?: ("default" | "status" | "actionable" | "trend") | undefined;
  statusColor?: KpiStatusColor | undefined;
  trend?: KpiTrend | undefined;
  action?: React.ReactNode | undefined;
  isLoading?: boolean | undefined;
  className?: string | undefined;
  onClick?: (() => void) | undefined;
}

const STATUS_COLOR_MAP: Record<KpiStatusColor, string> = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  destructive: "text-rose-600 dark:text-rose-400",
  primary: "text-primary",
  muted: "text-muted-foreground",
};

export function KpiCard({
  label,
  value,
  subtext,
  sub,
  icon: Icon,
  iconClassName,
  iconContainerClassName,
  statusColor = "default",
  trend,
  action,
  isLoading = false,
  className,
  onClick,
}: KpiCardProps) {
  const subtitle = subtext ?? sub;

  if (isLoading) {
    return (
      <Card
        className={cn(
          "rounded-xl border border-border bg-card shadow-none",
          className,
        )}
      >
        <CardContent className="p-4 flex items-start justify-between gap-3">
          <div className="space-y-2 w-full">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-28" />
            {subtitle && <Skeleton className="h-3.5 w-36" />}
          </div>
          {Icon && <Skeleton className="h-9 w-9 rounded-lg shrink-0" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-card shadow-none transition-all flex flex-col justify-between",
        onClick && "cursor-pointer hover:border-border/80 hover:bg-muted/40",
        className,
      )}
    >
      <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <p
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  STATUS_COLOR_MAP[statusColor],
                )}
              >
                {value}
              </p>
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md",
                    trend.direction === "up" &&
                      "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
                    trend.direction === "down" &&
                      "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400",
                    trend.direction === "neutral" &&
                      "text-muted-foreground bg-muted",
                  )}
                >
                  {trend.direction === "up" && <ArrowUpRight className="size-3" />}
                  {trend.direction === "down" && <ArrowDownRight className="size-3" />}
                  {trend.direction === "neutral" && <Minus className="size-3" />}
                  {trend.value}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-normal line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>

          {Icon && (
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
                iconContainerClassName,
              )}
            >
              <Icon className={cn("size-4", iconClassName)} />
            </div>
          )}
        </div>

        {action && <div className="pt-2 border-t border-border/40">{action}</div>}
      </CardContent>
    </Card>
  );
}
