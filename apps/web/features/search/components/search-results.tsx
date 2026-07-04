"use client";

import { MapPinOff } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { cn } from "@moja/ui/lib/utils";
import { SORT_OPTIONS_UI } from "../lib/constants";
import { OfferCard } from "./offer-card";
import type { RouterOutputs } from "@/trpc/client";
import type { SearchSortOption } from "../lib/params";

type SearchResponse = RouterOutputs["search"]["search"];

interface SearchResultsProps {
  results: SearchResponse | undefined;
  isLoading: boolean;
  sort: SearchSortOption;
  date: string;
  passengers: number;
  onSortChange: (sort: SearchSortOption) => void;
  onClearFilters: () => void;
}

export function SearchResults({
  results,
  isLoading,
  sort,
  date,
  passengers,
  onSortChange,
  onClearFilters,
}: SearchResultsProps) {
  return (
    <div className="lg:col-span-9 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div className="text-sm text-slate-500 font-semibold">
          {results ? `${results.total} available departures found` : "Searching departures..."}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold uppercase text-slate-400 mr-1.5">Sort By:</span>
          {SORT_OPTIONS_UI.map((s) => (
            <Button
              key={s.id}
              type="button"
              variant={sort === s.id ? "default" : "outline"}
              onClick={() => onSortChange(s.id as SearchSortOption)}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-semibold transition-all",
                sort === s.id
                  ? "bg-[#ee237c] hover:bg-[#d01867] text-white border-transparent"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((idx) => (
            <Card key={idx} className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-32 bg-slate-200 rounded" />
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-4">
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-2 bg-slate-100 self-center rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 w-24 bg-slate-100 rounded" />
                    <div className="h-10 w-28 bg-slate-200 rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : results && results.offers.length > 0 ? (
        <div className="space-y-4">
          {results.offers.map((offer) => (
            <OfferCard key={offer.offerId} offer={offer} passengers={passengers} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm px-6">
          <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <MapPinOff className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold font-montserrat mb-1">No Departures Found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            We couldn't find any trips matching your selection on {date}. Try
            choosing another travel date or adjusting your filters.
          </p>
          <Button variant="outline" onClick={onClearFilters} className="border-slate-200 rounded-xl font-bold">
            Reset Filters & Sort
          </Button>
        </div>
      )}
    </div>
  );
}