"use client";

import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";

export function ScheduleToolbar({
  total,
  q,
  onQChange,
  status,
  onStatusChange,
  serviceType,
  onServiceTypeChange,
  canCreate,
  onNew,
  routes,
  routeId,
  onRouteChange,
}: {
  total: number;
  q: string;
  onQChange: (v: string) => void;
  status: "all" | "active" | "inactive";
  onStatusChange: (v: "all" | "active" | "inactive") => void;
  serviceType: "all" | "INTERCITY" | "URBAN";
  onServiceTypeChange: (v: "all" | "INTERCITY" | "URBAN") => void;
  canCreate: boolean;
  onNew: () => void;
  routes?: Array<{ id: string; label: string }>;
  routeId?: string;
  onRouteChange?: (routeId: string) => void;
}) {
  const t = useTranslations("operatorDashboard.schedules");
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-border shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
        <p className="text-sm font-semibold text-foreground shrink-0">
          {t("schedulesCount", { count: total })}
        </p>
        <div className="relative max-w-xs flex-1 min-w-[140px]">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-8 pl-8 text-xs"
            aria-label={t("searchPlaceholder")}
          />
        </div>
        <select
          value={status}
          onChange={(e) =>
            onStatusChange(e.target.value as "all" | "active" | "inactive")
          }
          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          aria-label={t("filters.statusAria")}
        >
          <option value="all">{t("filters.statusAll")}</option>
          <option value="active">{t("filters.statusActive")}</option>
          <option value="inactive">{t("filters.statusInactive")}</option>
        </select>
        <select
          value={serviceType}
          onChange={(e) =>
            onServiceTypeChange(e.target.value as "all" | "INTERCITY" | "URBAN")
          }
          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          aria-label={t("filters.serviceTypeAria")}
        >
          <option value="all">{t("filters.serviceTypeAll")}</option>
          <option value="INTERCITY">{t("filters.serviceTypeIntercity")}</option>
          <option value="URBAN">{t("filters.serviceTypeUrban")}</option>
        </select>
        {onRouteChange && routes && routes.length > 0 ? (
          <select
            value={routeId ?? ""}
            onChange={(e) => onRouteChange(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs max-w-[200px]"
            aria-label={t("filters.routeAria")}
          >
            <option value="">{t("filters.allRoutes")}</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {canCreate && (
        <Button size="sm" className="h-8 text-xs shrink-0" onClick={onNew}>
          <Plus className="size-3.5 mr-1.5" />
          {t("createSchedule")}
        </Button>
      )}
    </div>
  );
}
