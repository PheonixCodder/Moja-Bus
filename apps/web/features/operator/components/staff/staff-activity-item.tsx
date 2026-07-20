"use client";

import { format } from "date-fns";
import { MemberAvatar } from "@/features/operator/components/staff/member-avatar";
import type { ActivityLogEntry } from "@/features/operator/lib/staff";

interface StaffActivityItemProps {
  entry: ActivityLogEntry;
}

export function StaffActivityItem({ entry }: StaffActivityItemProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-accent/20 transition-colors">
      <MemberAvatar name={entry.user.fullName} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] text-foreground">{entry.description}</span>
      </div>
      <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
        {format(new Date(entry.createdAt), "HH:mm")}
      </span>
    </div>
  );
}
