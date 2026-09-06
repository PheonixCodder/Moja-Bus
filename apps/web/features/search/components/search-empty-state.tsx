"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Bus } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";

interface QuickRoute {
  from: string;
  to: string;
  label: string;
}

const POPULAR_ROUTES: QuickRoute[] = [
  { from: "Abidjan", to: "Bouak%C3%A9", label: "Abidjan ➔ Bouaké" },
  { from: "Abidjan", to: "Yamoussoukro", label: "Abidjan ➔ Yamoussoukro" },
  { from: "Abidjan", to: "San-P%C3%A9dro", label: "Abidjan ➔ San-Pédro" },
  { from: "Abidjan", to: "Korhogo", label: "Abidjan ➔ Korhogo" },
];

interface SearchEmptyStateProps {
  onQuickSearch: (criteria: { from: string; to: string; date: string }) => void;
}

export const SearchEmptyState = memo(function SearchEmptyState({
  onQuickSearch,
}: SearchEmptyStateProps) {
  const t = useTranslations("search");
  const today = new Date();
  const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

  return (
    <div className="text-center py-16 px-6">
      <div className="bg-primary/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
        <Bus className="h-10 w-10 animate-pulse" />
      </div>
      <h3 className="text-xl font-bold font-heading mb-2 text-foreground">
        {t("emptyTitle")}
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">
        {t("emptySubtitle")}
      </p>

      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          {t("popularRoutes")}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {POPULAR_ROUTES.map((route) => (
            <Button
              key={route.label}
              variant="outline"
              size="sm"
              className="rounded-full border-primary/20 text-primary hover:bg-primary/10 text-xs font-semibold transition-all"
              onClick={() =>
                onQuickSearch({
                  from: decodeURIComponent(route.from),
                  to: decodeURIComponent(route.to),
                  date: todayStr,
                })
              }
            >
              {route.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
});
