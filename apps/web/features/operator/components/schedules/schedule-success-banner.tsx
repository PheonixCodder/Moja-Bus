"use client";

import Link from "next/link";
import { CheckCircle2, Radio } from "lucide-react";
import { useTranslations } from "next-intl";

export function ScheduleSuccessBanner({
  tripsCreated,
  onDismiss,
}: {
  tripsCreated: number;
  onDismiss: () => void;
}) {
  const t = useTranslations("operatorDashboard.schedules");
  return (
    <div className="border border-primary/20 bg-primary/5 rounded-md p-4 flex items-start gap-3">
      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{t("successBanner.schedulePublished")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("successBanner.tripsGenerated", { count: tripsCreated })}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Link
            href="/dashboard/operator/trips"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
          >
            <Radio className="size-3.5" />
            {t("successBanner.openDispatch")}
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("successBanner.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
