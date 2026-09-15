"use client";

import React from "react";
import { cn } from "@moja/ui/lib/utils";

export interface KpiGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: (1 | 2 | 3 | 4 | 5) | undefined;
  className?: string | undefined;
}

const COLS_MAP: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

export function KpiGrid({
  children,
  cols = 4,
  className,
  ...props
}: KpiGridProps) {
  return (
    <div
      className={cn("grid gap-4", COLS_MAP[cols] ?? COLS_MAP[4], className)}
      {...props}
    >
      {children}
    </div>
  );
}
