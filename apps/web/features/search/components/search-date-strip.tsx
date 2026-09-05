"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@moja/ui/lib/utils";
import { useCheapestByDate } from "../hooks/use-cheapest-by-date";
import { formatPriceXOF } from "../lib/format";
import { Button } from "@moja/ui/components/ui/button";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface SearchDateStripProps {
  from: string;
  to: string;
  fromMuni?: string;
  toMuni?: string;
  fromQuarter?: string;
  toQuarter?: string;
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
}

function parseUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

function todayUTCString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

export const SearchDateStrip = memo(function SearchDateStrip({
  from,
  to,
  fromMuni,
  toMuni,
  fromQuarter,
  toQuarter,
  selectedDate,
  onSelectDate,
}: SearchDateStripProps) {
  const t = useTranslations("search");
  const effectiveCenter = selectedDate || todayUTCString();
  const hasRoute = !!from && !!to;

  const { data: cheapestData, isLoading } = useCheapestByDate(
    from,
    to,
    effectiveCenter,
    fromMuni,
    toMuni,
    fromQuarter,
    toQuarter,
  );

  // Generate 7 dates centered on effectiveCenter
  const centerDate = parseUTCDate(effectiveCenter);
  const days = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(centerDate);
    dt.setUTCDate(centerDate.getUTCDate() + (i - 3));
    const dateStr = dt.toISOString().split("T")[0]!;
    return {
      date: dt,
      dateStr,
      weekday: WEEKDAYS[dt.getUTCDay()]!,
      dayNum: dt.getUTCDate(),
      month: MONTHS[dt.getUTCMonth()]!,
    };
  });

  // Find cheapest priceXOF across all days (for "Best" badge)
  const allPrices = cheapestData
    ? cheapestData.map((d) => d.priceXOF).filter((p): p is number => p !== null)
    : [];
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;

  return (
    <div className="w-full z-30">
      <div className="flex items-stretch gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-1 pt-3">
        {days.map(({ dateStr, weekday, dayNum, month }) => {
          const isSelected = dateStr === effectiveCenter;
          const priceEntry = cheapestData?.find((d) => d.date === dateStr);
          const priceXOF = hasRoute ? (priceEntry?.priceXOF ?? null) : null;
          const hasTrips = priceXOF !== null;
          const isCheapest =
            hasTrips && priceXOF === minPrice && allPrices.length > 1;
          // A day is selectable if it has trips, OR it's the currently selected date
          const isSelectable = hasTrips || isSelected || !hasRoute;

          return (
            <Button
              key={dateStr}
              type="button"
              variant="outline"
              disabled={!isSelectable}
              onClick={() => isSelectable && onSelectDate(dateStr)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 min-w-[72px] sm:min-w-[88px] h-auto rounded-xl px-2 py-3 transition-all duration-150 border shadow-none",
                isSelected
                  ? "bg-primary border-primary text-primary-foreground shadow-md hover:bg-primary/90"
                  : isSelectable
                    ? "bg-card border-border text-foreground hover:border-primary/60 hover:bg-primary/5 cursor-pointer"
                    : "bg-card border-border/50 text-muted-foreground/40 cursor-not-allowed opacity-60",
              )}
              aria-pressed={isSelected}
              aria-label={`${weekday} ${dayNum} ${month}${priceXOF ? ` – ${formatPriceXOF(priceXOF)}` : ""}`}
            >
              {/* Cheapest badge */}
              {isCheapest && !isSelected && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-success text-success-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap leading-none">
                  {t("bestBadge")}
                </span>
              )}

              {/* Weekday */}
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wide mb-0.5",
                  isSelected
                    ? "text-primary-foreground/80"
                    : isSelectable
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40",
                )}
              >
                {weekday}
              </span>

              {/* Day number */}
              <span
                className={cn(
                  "text-xl sm:text-2xl font-bold leading-none mb-1",
                  isSelected
                    ? "text-primary-foreground"
                    : isSelectable
                      ? "text-foreground"
                      : "text-muted-foreground/40",
                )}
              >
                {dayNum}
              </span>

              {/* Month */}
              <span
                className={cn(
                  "text-[10px] font-medium mb-1.5",
                  isSelected
                    ? "text-primary-foreground/80"
                    : isSelectable
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40",
                )}
              >
                {month}
              </span>

              {/* Price */}
              {isLoading && hasRoute ? (
                <span className="h-3 w-10 bg-muted rounded-full animate-pulse" />
              ) : hasTrips ? (
                <span
                  className={cn(
                    "text-[11px] font-bold",
                    isSelected
                      ? "text-primary-foreground"
                      : isCheapest
                        ? "text-success"
                        : "text-primary",
                  )}
                >
                  {formatPriceXOF(priceXOF)}
                </span>
              ) : (
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    isSelected ? "text-primary-foreground/70" : "text-muted-foreground/40",
                  )}
                >
                  —
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
});
