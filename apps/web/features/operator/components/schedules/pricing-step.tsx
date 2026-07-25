"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@moja/ui/components/ui/input";
import type {
  FareDraft,
  StopLabel,
} from "@/features/operator/lib/schedules/types";

export function PricingStep({
  stops,
  fares,
  onChange,
}: {
  stops: StopLabel[];
  fares: FareDraft[];
  onChange: (fares: FareDraft[]) => void;
}) {
  const t = useTranslations("operatorDashboard.schedules");

  function getFare(from: number, to: number): FareDraft | undefined {
    return fares.find(
      (f) =>
        f.fromStopOrder === from &&
        f.toStopOrder === to,
    );
  }

  function upsertFare(
    from: number,
    to: number,
    patch: Partial<FareDraft>,
  ) {
    const existing = fares.filter(
      (f) =>
        !(
          f.fromStopOrder === from &&
          f.toStopOrder === to
        ),
    );
    const prev = getFare(from, to);
    const next: FareDraft = {
      fromStopOrder: from,
      toStopOrder: to,
      priceXOF: patch.priceXOF ?? prev?.priceXOF ?? 0,
      type: patch.type ?? prev?.type ?? "FIXED",
    };
    if (next.priceXOF <= 0 && patch.priceXOF !== undefined) {
      onChange(existing);
      return;
    }
    onChange([...existing, next]);
  }

  if (stops.length < 2) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        {t("wizard.minStopsRequired")}
      </div>
    );
  }

  const segmentPairs: [StopLabel, StopLabel][] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      segmentPairs.push([stops[i]!, stops[j]!]);
    }
  }

  const lastOrder = stops[stops.length - 1]!.order;
  const hasFullRoute = fares.some(
    (f) => f.fromStopOrder === 0 && f.toStopOrder === lastOrder && f.priceXOF > 0,
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">{t("wizard.segmentPricingTitle")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("wizard.segmentPricingDesc")}
        </p>
        {!hasFullRoute && (
          <p className="text-xs text-amber-700 mt-1">
            {t("wizard.segmentPricingFullRoute")}
          </p>
        )}
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <div className="grid bg-slate-50 border-b border-border px-4 py-2.5">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "1fr 1fr auto auto" }}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("wizard.from")}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("wizard.to")}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("wizard.type")}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-28">
              {t("wizard.fare")}
            </span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {segmentPairs.map(([from, to]) => {
            const fare = getFare(from.order, to.order);

            return (
              <div
                key={`${from.order}-${to.order}`}
                className="grid gap-2 px-4 py-3 items-center hover:bg-slate-50/50 transition-colors"
                style={{ gridTemplateColumns: "1fr 1fr auto auto" }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {from.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{from.city}</p>
                </div>
                <div className="min-w-0 flex items-center gap-1.5">
                  <ArrowRight className="size-3 text-muted-foreground/40 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {to.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{to.city}</p>
                  </div>
                </div>
                <div className="w-24">
                  <label className="sr-only" htmlFor={`type-${from.order}-${to.order}`}>
                    {t("wizard.fareType")}
                  </label>
                  <select
                    id={`type-${from.order}-${to.order}`}
                    value={fare?.type ?? "FIXED"}
                    onChange={(e) =>
                      upsertFare(from.order, to.order, {
                        type: e.target.value as FareDraft["type"],
                        priceXOF: fare?.priceXOF ?? 0,
                      })
                    }
                    className="w-full h-8 text-xs border border-input rounded-md bg-background px-1"
                  >
                    <option value="FIXED">{t("wizard.fareFixed")}</option>
                    <option value="PROMO">{t("wizard.farePromo")}</option>
                    <option value="HOLIDAY_SURGE">{t("wizard.fareHolidaySurge")}</option>
                    <option value="EARLY_BIRD">{t("wizard.fareEarlyBird")}</option>
                  </select>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    min={1}
                    placeholder={t("wizard.farePlaceholder")}
                    value={fare?.priceXOF || ""}
                    onChange={(e) => {
                      const parsed = parseInt(
                        e.target.value.replace(/\D/g, ""),
                        10,
                      );
                      upsertFare(from.order, to.order, {
                        type: fare?.type ?? "FIXED",
                        priceXOF: Number.isNaN(parsed) ? 0 : parsed,
                      });
                    }}
                    className="h-8 text-sm text-right font-mono"
                    aria-label={t("wizard.fareAria", { fromName: from.name, toName: to.name })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {t("wizard.segmentPricingFooter")}
      </p>
    </div>
  );
}