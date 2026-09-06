"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Clock, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatAdminDateTime } from "@/lib/format-date";

interface VerificationDetailsTimelineProps {
  activityLogs: any[];
}

export function VerificationDetailsTimeline({
  activityLogs,
}: VerificationDetailsTimelineProps) {
  const t = useTranslations("adminDashboard.verificationDetailsTimeline");
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-foreground">
          {t("verificationActivityHistory")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("auditTrailsDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {activityLogs && activityLogs.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {activityLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Bullet Node */}
                <div className="absolute -left-5 top-1.5 size-2.5 rounded-full border-2 border-background bg-muted-foreground group-hover:bg-primary transition-colors ring-4 ring-muted/50" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatAdminDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {log.description}
                  </p>
                  {log.user && (
                    <div className="text-xs text-muted-foreground font-bold flex items-center gap-1 pt-0.5">
                      <Shield className="size-3" />
                      <span>
                        {t("triggeredBy")} {log.user.fullName || log.user.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/30">
            {t("noActivityLogs")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
