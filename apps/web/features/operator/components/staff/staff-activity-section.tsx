"use client";

import { Activity } from "lucide-react";
import { StaffActivityItem } from "@/features/operator/components/staff/staff-activity-item";
import { groupActivityByDate } from "@/features/operator/lib/group-activity-by-date";
import type { ActivityLogEntry } from "@/features/operator/lib/staff";

interface StaffActivitySectionProps {
  activities: ActivityLogEntry[];
}

export function StaffActivitySection({ activities }: StaffActivitySectionProps) {
  const groups = groupActivityByDate(activities);

  return (
    <section>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5" />
        Organization Activity
      </h2>

      {activities.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card py-8 shadow-sm">
          <p className="text-[13px] text-muted-foreground">No recent activity</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden shadow-sm">
          {Object.entries(groups).map(([dateLabel, logs]) => (
            <div key={dateLabel}>
              <div className="px-4 py-2 bg-accent/30 border-y border-border/50 first:border-t-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {dateLabel}
                </span>
              </div>
              <div className="divide-y divide-border/50">
                {logs.map((log) => (
                  <StaffActivityItem key={log.id} entry={log} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
