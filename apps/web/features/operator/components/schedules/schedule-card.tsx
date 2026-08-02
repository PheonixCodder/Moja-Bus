"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Pencil,
  Power,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { useTranslations } from "next-intl";
import { Button } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { UrbanBadge } from "@/components/urban-badge";
import { formatCityWithMuni } from "@/lib/format-location-label";
import {
  DAYS,
  formatTime,
} from "@/features/operator/lib/schedules/schedule-search-params";
import type { ScheduleListItem } from "@/features/operator/lib/schedules/types";

/** "06:00 AM · 07:30 AM · 09:00 AM (+2)" — up to 3 times, then a count. */
function formatTimes(schedule: ScheduleListItem): string {
  const times =
    schedule.departureTimes?.length > 0
      ? schedule.departureTimes
      : [schedule.departureTime];
  const shown = times.slice(0, 3).map(formatTime).join(" · ");
  const extra = times.length - 3;
  return extra > 0 ? `${shown} (+${extra})` : shown;
}

export function ScheduleCard({
  schedule,
  canUpdate,
  canDelete,
  extending,
  onEdit,
  onDelete,
  onExtend,
  onRetire,
}: {
  schedule: ScheduleListItem;
  canUpdate: boolean;
  canDelete: boolean;
  extending: boolean;
  onEdit: (s: ScheduleListItem) => void;
  onDelete: (s: ScheduleListItem) => void;
  onExtend: (s: ScheduleListItem) => void;
  onRetire: (s: ScheduleListItem) => void;
}) {
  const cal = schedule.calendar;
  const tc = useTranslations("common");
  const t = useTranslations("operatorDashboard.schedules.card");
  const activeDays = cal
    ? DAYS.filter((d) => cal[d.key as keyof typeof cal]).map((d) => d.label)
    : [];

  return (
    <Card className="group border-border bg-card shadow-none hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground truncate">
                {schedule.name ?? schedule.route?.name ?? t("unnamed")}
              </p>
              {schedule.route?.serviceType === "URBAN" && <UrbanBadge />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {formatCityWithMuni(
                  schedule.route?.originTerminal?.cityRelation?.name ??
                    schedule.route?.originTerminal?.city,
                  schedule.route?.originTerminal?.municipality?.name,
                )}
              </span>
              <ArrowRight className="size-3 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">
                {formatCityWithMuni(
                  schedule.route?.destTerminal?.cityRelation?.name ??
                    schedule.route?.destTerminal?.city,
                  schedule.route?.destTerminal?.municipality?.name,
                )}
              </span>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              schedule.isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-50 text-slate-500 border-slate-200",
            )}
          >
            {schedule.isActive ? t("active") : t("inactive")}
          </span>
        </div>

        <div className="flex items-center gap-3 pt-2.5 border-t border-border flex-wrap min-h-[38px]">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3 text-muted-foreground/60" />
            <span className="text-[11px] font-semibold text-foreground">
              {formatTimes(schedule)}
            </span>
          </div>
          {activeDays.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {activeDays.map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
          <Link
            href={`/dashboard/operator/trips?scheduleId=${schedule.id}`}
            className="text-[11px] text-muted-foreground hover:text-primary ml-auto"
          >
            {t("upcomingAndTotal", { upcoming: schedule.futureTripsInWindow ?? 0, total: schedule._count?.trips ?? 0 })}
          </Link>
        </div>

        {!schedule.preferredBus || schedule.preferredBus.status !== "ACTIVE" ? (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
            {schedule.preferredBus
              ? t("busInactiveWarning", { plate: schedule.preferredBus.registrationPlate, status: schedule.preferredBus.status.toLowerCase() })
              : t("noBusWarning")}
          </p>
        ) : null}

        {(canUpdate || canDelete) && (
          <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-150">
            {canUpdate && schedule.isActive && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5 font-semibold gap-1"
                onClick={() => onExtend(schedule)}
                disabled={extending}
                aria-label={t("extendAria")}
              >
                {extending ? (
                  <Spinner className="size-3" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                {t("extend")}
              </Button>
            )}
            {canUpdate && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted font-semibold gap-1"
                onClick={() => onEdit(schedule)}
                aria-label={t("editAria")}
              >
                <Pencil className="size-3" />
                {tc("edit")}
              </Button>
            )}
            {canUpdate && schedule.isActive && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] text-muted-foreground hover:text-amber-700 hover:bg-amber-50 font-semibold gap-1"
                onClick={() => onRetire(schedule)}
                aria-label={t("retireAria")}
              >
                <Power className="size-3" />
                {t("retire")}
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                onClick={() => onDelete(schedule)}
                aria-label={t("deleteAria")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
