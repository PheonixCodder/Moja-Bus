"use client";

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

export function SearchResults({
  offers,
  isLoading,
  isLoadingMore,
  hasNextPage,
  date,
  passengers,
  onClearFilters,
  onLoadMore,
}: SearchResultsProps) {
  // Loading skeleton — shown only on initial search (page 1)
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((idx) => (
          <Card key={idx} className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-200 rounded-full" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-slate-200 rounded" />
                      <div className="h-3 w-16 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                </div>
                <div className="grid grid-cols-3 gap-4 py-2">
                  <div className="space-y-1">
                    <div className="h-6 w-16 bg-slate-200 rounded" />
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                  </div>
                  <div className="flex flex-col items-center gap-1 self-center">
                    <div className="h-2 w-full bg-slate-100 rounded-full" />
                    <div className="h-2.5 w-14 bg-slate-100 rounded" />
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-6 w-16 bg-slate-200 rounded ml-auto" />
                    <div className="h-3 w-24 bg-slate-100 rounded ml-auto" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                  <div className="h-10 w-32 bg-slate-200 rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // No results
  if (offers.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm px-6">
        <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
          <MapPinOff className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-bold font-montserrat mb-1 text-slate-800">
          No Departures Found
        </h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
          We couldn&apos;t find any trips matching your selection on {date}. Try choosing another
          travel date or adjusting your filters.
        </p>
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="border-slate-200 rounded-xl font-bold text-slate-600 hover:border-[#ee237c] hover:text-[#ee237c] transition-colors"
        >
          Reset Filters
        </Button>
      </div>
    );
  }

  // Offer list + Load More
  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <OfferCard key={offer.offerId} offer={offer} passengers={passengers} />
      ))}

      {/* Load More */}
      {hasNextPage && (
        <div className="pt-2 flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-8 h-11 rounded-full border-2 border-slate-200 font-bold text-slate-600 hover:border-[#ee237c] hover:text-[#ee237c] transition-all disabled:opacity-50"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-slate-300 border-t-[#ee237c] rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4" />
                Load more departures
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}