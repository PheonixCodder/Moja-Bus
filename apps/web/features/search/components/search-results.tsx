"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { MapPinOff, ChevronDown } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { OfferCard } from "./offer-card";
import type { RouterOutputs } from "@/trpc/client";

type SearchOffer = RouterOutputs["search"]["search"]["offers"][number];

interface SearchResultsProps {
  offers: SearchOffer[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  date: string;
  passengers: number;
  onClearFilters: () => void;
  onLoadMore: () => void;
}

export const SearchResults = memo(function SearchResults({
  offers,
  isLoading,
  isLoadingMore,
  hasNextPage,
  date,
  passengers,
  onClearFilters,
  onLoadMore,
}: SearchResultsProps) {
  const t = useTranslations("search");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((idx) => (
          <Card
            key={idx}
            className="border border-border shadow-sm rounded-2xl overflow-hidden bg-card"
          >
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-full" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted/60 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-muted/60 rounded" />
                </div>
                <div className="grid grid-cols-3 gap-4 py-2">
                  <div className="space-y-1">
                    <div className="h-6 w-16 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted/60 rounded" />
                  </div>
                  <div className="flex flex-col items-center gap-1 self-center">
                    <div className="h-2 w-full bg-muted/60 rounded-full" />
                    <div className="h-2.5 w-14 bg-muted/60 rounded" />
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-6 w-16 bg-muted rounded ml-auto" />
                    <div className="h-3 w-24 bg-muted/60 rounded ml-auto" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <div className="h-4 w-20 bg-muted/60 rounded" />
                  <div className="h-10 w-32 bg-muted rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm px-6">
        <div className="bg-muted/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground/60">
          <MapPinOff className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-bold font-montserrat mb-1 text-foreground">
          {t("noResultsTitle")}
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
          {t("noResultsDesc", { date })}
        </p>
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="border-border rounded-xl font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {t("resetFilters")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <OfferCard key={offer.offerId} offer={offer} passengers={passengers} />
      ))}

      {hasNextPage && (
        <div className="pt-2 flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-8 h-11 rounded-full border-2 border-border font-bold text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-50"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-border border-t-primary rounded-full animate-spin" />
                {t("loadingLabel")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4" />
                {t("loadMore")}
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
});
