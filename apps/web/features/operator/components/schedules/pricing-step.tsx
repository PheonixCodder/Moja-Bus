"use client";

import { ArrowRight } from "lucide-react";
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
  function getFare(from: number, to: number, seatClass: FareDraft["seatClass"]) {
    return fares.find(
      (f) =>
        f.fromStopOrder === from &&
        f.toStopOrder === to &&
        f.seatClass === seatClass,
    );
  }

  function upsertFare(
    from: number,
    to: number,
    patch: Partial<FareDraft> & { seatClass: FareDraft["seatClass"] },
  ) {
    const existing = fares.filter(
      (f) =>
        !(
          f.fromStopOrder === from &&
          f.toStopOrder === to &&
          f.seatClass === patch.seatClass
        ),
    );
    const prev = getFare(from, to, patch.seatClass);
    const next: FareDraft = {
      fromStopOrder: from,
      toStopOrder: to,
      priceXOF: patch.priceXOF ?? prev?.priceXOF ?? 0,
      type: patch.type ?? prev?.type ?? "FIXED",
      seatClass: patch.seatClass,
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
        At least 2 stops are required to configure pricing.
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
        <h3 className="text-sm font-bold text-foreground">Segment pricing</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set ticket fares (in FCFA). At least one origin→destination fare is
          required.
        </p>
        {!hasFullRoute && (
          <p className="text-xs text-amber-700 mt-1">
            Add a full-route fare (first stop → last stop) before publishing.
          </p>
        )}
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <div className="grid bg-slate-50 border-b border-border px-4 py-2.5">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "1fr 1fr auto auto auto" }}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              From
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              To
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Type
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Class
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-28">
              Fare (FCFA)
            </span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {segmentPairs.map(([from, to]) => {
            const seatClass: FareDraft["seatClass"] =
              getFare(from.order, to.order, "ECONOMY")?.seatClass ??
              getFare(from.order, to.order, "STANDARD")?.seatClass ??
              getFare(from.order, to.order, "VIP")?.seatClass ??
              "ECONOMY";
            const fare =
              getFare(from.order, to.order, seatClass) ??
              getFare(from.order, to.order, "ECONOMY");

            return (
              <div
                key={`${from.order}-${to.order}`}
                className="grid gap-2 px-4 py-3 items-center hover:bg-slate-50/50 transition-colors"
                style={{ gridTemplateColumns: "1fr 1fr auto auto auto" }}
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
                    Fare type
                  </label>
                  <select
                    id={`type-${from.order}-${to.order}`}
                    value={fare?.type ?? "FIXED"}
                    onChange={(e) =>
                      upsertFare(from.order, to.order, {
                        seatClass: fare?.seatClass ?? "ECONOMY",
                        type: e.target.value as FareDraft["type"],
                        priceXOF: fare?.priceXOF ?? 0,
                      })
                    }
                    className="w-full h-8 text-xs border border-input rounded-md bg-background px-1"
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="PROMO">Promo</option>
                    <option value="HOLIDAY_SURGE">Holiday Surge</option>
                    <option value="EARLY_BIRD">Early Bird</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="sr-only" htmlFor={`class-${from.order}-${to.order}`}>
                    Seat class
                  </label>
                  <select
                    id={`class-${from.order}-${to.order}`}
                    value={fare?.seatClass ?? "ECONOMY"}
                    onChange={(e) => {
                      const nextClass = e.target.value as FareDraft["seatClass"];
                      const without = fares.filter(
                        (f) =>
                          !(
                            f.fromStopOrder === from.order &&
                            f.toStopOrder === to.order
                          ),
                      );
                      onChange([
                        ...without,
                        {
                          fromStopOrder: from.order,
                          toStopOrder: to.order,
                          priceXOF: fare?.priceXOF ?? 0,
                          type: fare?.type ?? "FIXED",
                          seatClass: nextClass,
                        },
                      ]);
                    }}
                    className="w-full h-8 text-xs border border-input rounded-md bg-background px-1"
                  >
                    <option value="ECONOMY">Economy</option>
                    <option value="STANDARD">Standard</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={fare?.priceXOF || ""}
                    onChange={(e) => {
                      const parsed = parseInt(
                        e.target.value.replace(/\D/g, ""),
                        10,
                      );
                      upsertFare(from.order, to.order, {
                        seatClass: fare?.seatClass ?? "ECONOMY",
                        type: fare?.type ?? "FIXED",
                        priceXOF: Number.isNaN(parsed) ? 0 : parsed,
                      });
                    }}
                    className="h-8 text-sm text-right font-mono"
                    aria-label={`Fare ${from.name} to ${to.name}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Leave a field at 0 to omit that segment. All prices are in West African
        CFA franc (FCFA).
      </p>
    </div>
  );
}
