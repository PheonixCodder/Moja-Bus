"use client";

import { format } from "date-fns";
import { AdminMemberAvatar } from "@/features/admin/components/staff/member-avatar";
import type { AdminActivityLogEntry } from "@/features/admin/lib/admin-staff";

interface AdminStaffActivityItemProps {
  entry: AdminActivityLogEntry;
}

export function AdminStaffActivityItem({ entry }: AdminStaffActivityItemProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-accent/20 transition-colors">
      <AdminMemberAvatar name={entry.user.fullName} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] text-foreground">{entry.description}</span>
      </div>
      <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
        {format(new Date(entry.createdAt), "HH:mm")}
      </span>
    </div>
  );
}
