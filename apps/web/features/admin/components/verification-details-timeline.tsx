"use client";

import { Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@moja/ui/components/ui/card";
import { formatAdminDateTime } from "@/lib/format-date";

interface VerificationDetailsTimelineProps {
  activityLogs: any[];
}

export function VerificationDetailsTimeline({ activityLogs }: VerificationDetailsTimelineProps) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900">
          Verification Activity History
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Audit trails and changes logged during the operator's verification lifecycle.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {activityLogs && activityLogs.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {activityLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Bullet Node */}
                <div className="absolute -left-[20px] top-1.5 size-[10px] rounded-full border-2 border-white bg-slate-400 group-hover:bg-primary transition-colors ring-4 ring-slate-50" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatAdminDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {log.description}
                  </p>
                  {log.user && (
                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 pt-0.5">
                      <Shield className="size-3" />
                      <span>Triggered by: {log.user.fullName || log.user.email}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            No activity logs recorded for this company.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
