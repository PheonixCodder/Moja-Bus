import React from "react";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { cn } from "@moja/ui/lib/utils";

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconClassName?: string;
  sub?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  sub,
}: StatCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10",
            iconClassName,
          )}
        >
          <Icon className="size-4 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}
