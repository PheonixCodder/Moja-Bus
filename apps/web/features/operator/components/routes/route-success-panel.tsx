"use client";

import { CalendarClock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { RouterOutputs } from "@/trpc/client";

type RouteType = RouterOutputs["routes"]["list"][number];

interface RouteSuccessPanelProps {
  route: RouteType | null;
  onDismiss: () => void;
}

export function RouteSuccessPanel({ route, onDismiss }: RouteSuccessPanelProps) {
  if (!route) return null;

  return (
    <div className="border border-primary/20 bg-primary/5 rounded-md p-4 flex items-start gap-3">
      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">Route created</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="font-medium">{route.name}</span> is ready. Create a
          schedule to start generating trips.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Link
            href="/dashboard/operator/schedules"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
          >
            <CalendarClock className="size-3.5" />
            Create Schedule →
          </Link>
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
