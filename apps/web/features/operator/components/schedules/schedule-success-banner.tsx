"use client";

import Link from "next/link";
import { CheckCircle2, Radio } from "lucide-react";

export function ScheduleSuccessBanner({
  tripsCreated,
  onDismiss,
}: {
  tripsCreated: number;
  onDismiss: () => void;
}) {
  return (
    <div className="border border-primary/20 bg-primary/5 rounded-md p-4 flex items-start gap-3">
      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">Schedule published</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {tripsCreated} trip{tripsCreated !== 1 ? "s" : ""} generated for the
          next 14 calendar days from today.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Link
            href="/dashboard/operator/trips"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
          >
            <Radio className="size-3.5" />
            Open Dispatch Board →
          </Link>
          <button
            type="button"
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
