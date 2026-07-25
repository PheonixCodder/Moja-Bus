"use client";

import { CalendarClock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { RouterOutputs } from "@/trpc/client";

type RouteType = RouterOutputs["routes"]["list"][number];

interface RouteSuccessPanelProps {
  route: RouteType | null;
  onDismiss: () => void;
}

export function RouteSuccessPanel({ route, onDismiss }: RouteSuccessPanelProps) {
  const t = useTranslations("operatorDashboard.routes");
  if (!route) return null;

  return (
    <div className="border border-primary/20 bg-primary/5 rounded-md p-4 flex items-start gap-3">
      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{t("successPanel.routeCreated")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("successPanel.description", { name: route.name })}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Link
            href="/dashboard/operator/schedules"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
          >
            <CalendarClock className="size-3.5" />
            {t("successPanel.createSchedule")}
          </Link>
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("successPanel.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
