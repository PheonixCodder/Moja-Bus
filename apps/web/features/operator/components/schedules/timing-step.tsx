"use client";

import { useTranslations } from "next-intl";
import { Input } from "@moja/ui/components/ui/input";
import type {
  TimingDraft,
  StopLabel,
} from "@/features/operator/lib/schedules/types";

export function TimingStep({
  stops,
  timings,
  onChange,
}: {
  stops: StopLabel[];
  timings: TimingDraft[];
  onChange: (timings: TimingDraft[]) => void;
}) {
  const t = useTranslations("operatorDashboard.schedules");

  const intermediateStops = stops.filter(
    (s) => s.order > 0 && s.order < stops[stops.length - 1]!.order,
  );

  if (intermediateStops.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        {t("wizard.noTimingNeeded")}
      </div>
    );
  }

  function getDwell(stopOrder: number): TimingDraft | undefined {
    return timings.find((tm) => tm.stopOrder === stopOrder);
  }

  function upsertDwell(stopOrder: number, dwellMinutes: number) {
    const existing = timings.filter((tm) => tm.stopOrder !== stopOrder);
    const next: TimingDraft = {
      stopOrder,
      dwellMinutes,
    };
    onChange([...existing, next]);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">
          {t("wizard.stopsTitle")}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("wizard.stopsDesc")}
        </p>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <div className="grid bg-slate-50 border-b border-border px-4 py-2.5">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "1fr auto" }}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("wizard.stop")}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-28 text-right">
              {t("wizard.dwellTime")}
            </span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {intermediateStops.map((s) => {
            const dwell = getDwell(s.order);
            const dwellValue = dwell?.dwellMinutes ?? 0;

            return (
              <div
                key={s.order}
                className="grid gap-2 px-4 py-3 items-center hover:bg-slate-50/50 transition-colors"
                style={{ gridTemplateColumns: "1fr auto" }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {s.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{s.city}</p>
                </div>
                <div className="w-28 flex items-center gap-2 justify-end">
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={dwellValue || ""}
                    onChange={(e) => {
                      const parsed = parseInt(
                        e.target.value.replace(/\D/g, ""),
                        10,
                      );
                      upsertDwell(s.order, Number.isNaN(parsed) ? 0 : parsed);
                    }}
                    className="h-8 text-sm text-right font-mono w-20"
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
        {t("wizard.stopsFooter")}
      </p>
    </div>
  );
}
