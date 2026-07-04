"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { useTRPC } from "@/trpc/client";
import { searchParamsSchema, type SearchSortOption } from "../lib/params";
import { FALLBACK_OPERATORS } from "../lib/constants";
import { SearchHero } from "./search-hero";
import { SearchForm } from "./search-form";
import { SearchEmptyState } from "./search-empty-state";
import { SearchFiltersSidebar } from "./search-filters-sidebar";
import { SearchResults } from "./search-results";

export function SearchPageClient() {
  const trpc = useTRPC();

  const [params, setParams] = useQueryStates(searchParamsSchema, {
    shallow: true,
    history: "replace",
  });

  const searchEnabled = !!params.from && !!params.to && !!params.date;

  const { data: results, isLoading } = useQuery({
    ...trpc.search.search.queryOptions({
      originCityId: params.from,
      destinationCityId: params.to,
      date: params.date,
      passengers: params.passengers,
      operators: params.operators.length > 0 ? params.operators : undefined,
      amenities: params.amenities.length > 0 ? params.amenities : undefined,
      departureTime:
        params.departureTime.length > 0 ? params.departureTime : undefined,
      maxPrice: params.maxPrice ?? undefined,
      sort: params.sort,
      page: params.page,
    }),
    enabled: searchEnabled,
  });

  const activeOperators = results?.offers?.length
    ? Array.from(
        new Map(
          results.offers.map((o) => [o.companyId, { id: o.companyId, name: o.companyName }]),
        ).values(),
      )
    : FALLBACK_OPERATORS;

  function handleSearch(criteria: {
    from: string;
    to: string;
    date: string;
    passengers: number;
  }) {
    void setParams({ ...criteria, page: 1 });
  }

  function handleToggleOperator(id: string) {
    const updated = params.operators.includes(id)
      ? params.operators.filter((o) => o !== id)
      : [...params.operators, id];
    void setParams({ operators: updated, page: 1 });
  }

  function handleToggleAmenity(id: string) {
    const updated = params.amenities.includes(id)
      ? params.amenities.filter((a) => a !== id)
      : [...params.amenities, id];
    void setParams({ amenities: updated, page: 1 });
  }

  function handleToggleTime(id: "MORNING" | "AFTERNOON" | "EVENING") {
    const updated = params.departureTime.includes(id)
      ? params.departureTime.filter((t) => t !== id)
      : [...params.departureTime, id];
    void setParams({ departureTime: updated, page: 1 });
  }

  function handleMaxPriceChange(value: number) {
    void setParams({ maxPrice: value, page: 1 });
  }

  function handleClearFilters() {
    void setParams({
      operators: [],
      amenities: [],
      departureTime: [],
      maxPrice: null,
      sort: "BEST",
      page: 1,
    });
  }

  function handleSortChange(sort: SearchSortOption) {
    void setParams({ sort, page: 1 });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans">
      <SearchHero />

      <div className="max-w-6xl mx-auto w-full px-4 -mt-8 relative z-20">
        <SearchForm
          initialFromId={params.from}
          initialToId={params.to}
          initialDate={params.date}
          initialPassengers={params.passengers}
          onSearch={handleSearch}
        />
      </div>

      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-grow">
        {!searchEnabled ? (
          <SearchEmptyState
            onQuickSearch={(c) => handleSearch({ ...c, passengers: params.passengers })}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <SearchFiltersSidebar
              operators={params.operators}
              amenities={params.amenities}
              departureTime={params.departureTime}
              maxPrice={params.maxPrice}
              activeOperators={activeOperators}
              onToggleOperator={handleToggleOperator}
              onToggleAmenity={handleToggleAmenity}
              onToggleTime={handleToggleTime}
              onMaxPriceChange={handleMaxPriceChange}
              onClear={handleClearFilters}
            />
            <SearchResults
              results={results}
              isLoading={isLoading}
              sort={params.sort}
              date={params.date}
              passengers={params.passengers}
              onSortChange={handleSortChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}
      </main>
    </div>
  );
}