"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@moja/ui/components/ui/input";
import type { TimingDraft } from "@/features/operator/lib/schedules/types";

type RouteWaypoint = {
  id: string;
  stopOrder: number;
  terminal: {
    name: string;
    cityRelation?: { name: string } | null;
    municipality?: { name: string } | null;
    quarter?: { name: string } | null;
    city?: string | null;
  } | null;
  isPickup: boolean;
  isDropoff: boolean;
};

export function TimingStep({
  waypoints,
  timings,
  onChange,
}: {
  waypoints: RouteWaypoint[];
  timings: TimingDraft[];
  onChange: (timings: TimingDraft[]) => void;
}) {
  const t = useTranslations("operatorDashboard.schedules");

  if (waypoints.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        {t("wizard.minStopsRequired")}
      </div>
    );
  }

  function getDwell(waypointId: string): TimingDraft | undefined {
    return timings.find((tm) => tm.routeWaypointId === waypointId);
  }

  function upsertDwell(waypointId: string, dwellMinutes: number) {
    const existing = timings.filter((tm) => tm.routeWaypointId !== waypointId);
    const next: TimingDraft = {
      routeWaypointId: waypointId,
      dwellMinutes,
    };
    onChange([...existing, next]);
  }

  const sortedWaypoints = [...waypoints]
    .filter((w) => w.stopOrder > 0)
    .sort((a, b) => a.stopOrder - b.stopOrder);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">{t("wizard.timingTitle")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("wizard.timingDesc")}
        </p>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <div className="grid bg-slate-50 border-b border-border px-4 py-2.5">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "1fr 1fr auto" }}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("wizard.from")}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("wizard.to")}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-28">
              {t("wizard.arrivalOffset")}
            </span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {sortedWaypoints.map((w) => {
            const dwell = getDwell(w.id);
            const dwellValue = dwell?.dwellMinutes ?? 0;

            return (
              <div
                key={w.id}
                className="grid gap-2 px-4 py-3 items-center hover:bg-slate-50/50 transition-colors"
                style={{ gridTemplateColumns: "1fr 1fr auto" }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {w.terminal?.name ?? "Stop"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {w.terminal?.cityRelation?.name ?? w.terminal?.city ?? ""}
                  </p>
                </div>
                <div className="min-w-0 flex items-center gap-1.5">
                  <Clock className="size-3 text-muted-foreground/40 shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {t("wizard.dwellAtStop")}
                  </span>
                </div>
                <div className="w-28 flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={dwellValue || ""}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value.replace(/\D/g, ""), 10);
                      upsertDwell(w.id, Number.isNaN(parsed) ? 0 : parsed);
                    }}
                    className="h-8 text-sm text-right font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    min
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {t("wizard.timingFooter")}
      </p>
    </div>
  );
}
