"use client";

import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminStaffActivityItem } from "@/features/admin/components/staff/admin-staff-activity-item";
import type { AdminActivityLogEntry } from "@/features/admin/lib/admin-staff";
import { groupAdminActivityByDate } from "@/features/admin/lib/group-admin-activity-by-date";

interface AdminStaffActivitySectionProps {
  activities: AdminActivityLogEntry[];
}

export function AdminStaffActivitySection({
  activities,
}: AdminStaffActivitySectionProps) {
  const t = useTranslations("adminDashboard.staff.activitySection");
  const groups = groupAdminActivityByDate(activities);

  return (
    <section>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5" />
        {t("title")}
      </h2>

      {activities.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card py-8 shadow-sm">
          <p className="text-[13px] text-muted-foreground">{t("empty")}</p>
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
                  <AdminStaffActivityItem key={log.id} entry={log} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
