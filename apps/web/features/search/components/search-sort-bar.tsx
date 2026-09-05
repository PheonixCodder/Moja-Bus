"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { TrendingDown, Zap, Clock, MoonStar } from "lucide-react";

const SORT_KEYS = ["CHEAPEST", "FASTEST", "EARLIEST", "LATEST"] as const;

const SORT_ICONS: Record<string, React.ReactNode> = {
  CHEAPEST: <TrendingDown className="h-3.5 w-3.5" />,
  FASTEST: <Zap className="h-3.5 w-3.5" />,
  EARLIEST: <Clock className="h-3.5 w-3.5" />,
  LATEST: <MoonStar className="h-3.5 w-3.5" />,
};

interface SearchSortBarProps {
  total: number;
  sort: string;
  isLoading: boolean;
  onSortChange: (sort: string) => void;
}

export const SearchSortBar = memo(function SearchSortBar({
  total,
  sort,
  isLoading,
  onSortChange,
}: SearchSortBarProps) {
  const t = useTranslations("search");

  const SORT_LABELS: Record<string, string> = {
    CHEAPEST: t("sortCheapest"),
    FASTEST: t("sortFastest"),
    EARLIEST: t("sortEarliest"),
    LATEST: t("sortLatest"),
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border">
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
          {t("selectTrip")}
        </p>
        {isLoading ? (
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
        ) : (
          <p className="text-lg font-bold text-foreground">
            {total.toLocaleString()}{" "}
            <span className="text-muted-foreground font-medium text-base">
              {total === 1 ? t("resultSingular") : t("resultPlural")}
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1 hidden sm:block">
          {t("sort.label")}
        </span>
        {SORT_KEYS.map((key) => {
          const isActive =
            sort === key || (sort === "BEST" && key === "CHEAPEST");
          return (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => onSortChange(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-full text-xs font-bold transition-all duration-150 border shadow-none",
                isActive
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-primary",
              )}
              aria-pressed={isActive}
            >
              {SORT_ICONS[key]}
              <span className="hidden sm:inline">{SORT_LABELS[key]}</span>
              <span className="sm:hidden">{SORT_LABELS[key]!.slice(0, 4)}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
});
