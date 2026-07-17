"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import type { User } from "better-auth";
import { useTRPC } from "@/trpc/client";
import { searchParamsSchema, type SearchSortOption } from "../lib/params";
import { SearchForm } from "./search-form";
import { SearchEmptyState } from "./search-empty-state";
import { SearchFiltersSidebar } from "./search-filters-sidebar";
import { SearchMobileFilters } from "./search-mobile-filters";
import { SearchResults } from "./search-results";
import { SearchSortBar } from "./search-sort-bar";
import { SearchDateStrip } from "./search-date-strip";
import { SearchPromoCard } from "./search-promo-card";
import { HomeHeader } from "@/features/home/components/home-header";
import { BookingDialog } from "@/features/booking/components/booking-dialog";
import type { RouterOutputs } from "@/trpc/client";

type SearchOffer = RouterOutputs["search"]["search"]["offers"][number];

interface SearchPageClientProps {
  user?: any;
}

export function SearchPageClient({ user }: SearchPageClientProps) {
  const trpc = useTRPC();

  const [params, setParams] = useQueryStates(searchParamsSchema, {
    shallow: true,
    history: "replace",
  });

  const searchEnabled = !!params.from && !!params.to && !!params.date;

  // Mobile filters drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ─── Search query ─────────────────────────────────────────────────────────
  const { data: results, isLoading, isFetching } = useQuery({
    ...trpc.search.search.queryOptions({
      originCityId: params.from,
      destinationCityId: params.to,
      date: params.date,
      passengers: params.passengers,
      operators: params.operators.length > 0 ? params.operators : undefined,
      amenities: params.amenities.length > 0 ? params.amenities : undefined,
      departureTime: params.departureTime.length > 0 ? params.departureTime : undefined,
      maxPrice: params.maxPrice ?? undefined,
      sort: params.sort,
      page: params.page,
    }),
    enabled: searchEnabled,
  });

  // ─── Accumulated offers (for Load More) ──────────────────────────────────
  const [allOffers, setAllOffers] = useState<SearchOffer[]>([]);
  const prevCriteriaKey = useRef("");
  const isLoadingMore = isFetching && params.page > 1;

  // Criteria key excludes `page` — changes to this key reset the list
  const criteriaKey = [
    params.from,
    params.to,
    params.date,
    params.passengers,
    params.operators.join(","),
    params.amenities.join(","),
    params.departureTime.join(","),
    params.sort,
  ].join("|");

  useEffect(() => {
    if (!results) return;
    if (criteriaKey !== prevCriteriaKey.current) {
      // New search — reset accumulated list
      prevCriteriaKey.current = criteriaKey;
      setAllOffers(results.offers);
    } else {
      // Load More — append to list
      setAllOffers((prev) => {
        const existingIds = new Set(prev.map((o) => o.offerId));
        const fresh = results.offers.filter((o) => !existingIds.has(o.offerId));
        return [...prev, ...fresh];
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  // ─── Active operators (derived from results) ──────────────────────────────
  const activeOperators = allOffers.length
    ? Array.from(
        new Map(
          allOffers.map((o) => [o.companyId, { id: o.companyId, name: o.companyName }]),
        ).values(),
      )
    : [];

  // ─── Active filter count (for mobile badge) ───────────────────────────────
  const activeFilterCount =
    params.operators.length +
    params.amenities.length +
    params.departureTime.length;

  // ─── Handlers ────────────────────────────────────────────────────────────
  function handleSearch(criteria: {
    from: string;
    to: string;
    date: string;
    passengers: number;
  }) {
    void setParams({ ...criteria, page: 1 });
  }

  function handleDateSelect(date: string) {
    void setParams({ date, page: 1 });
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

  function handleClearFilters() {
    void setParams({
      operators: [],
      amenities: [],
      departureTime: [],
      sort: "BEST",
      page: 1,
    });
  }

  function handleSortChange(sort: string) {
    void setParams({ sort: sort as SearchSortOption, page: 1 });
  }

  function handleLoadMore() {
    void setParams({ page: params.page + 1 });
  }

  const filterProps = {
    operators: params.operators,
    amenities: params.amenities,
    departureTime: params.departureTime,
    activeOperators,
    onToggleOperator: handleToggleOperator,
    onToggleAmenity: handleToggleAmenity,
    onToggleTime: handleToggleTime,
    onClear: handleClearFilters,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-slate-800 antialiased font-sans">

      {/* ── CONTAINER 1: Hero zone (rose-50 bg) ─────────────────────────── */}
      <div className="bg-rose-50 pt-20">
        {/* Fixed sticky nav — same as home page */}
        <HomeHeader user={user} />

        {/* Search form */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <SearchForm
            initialFromId={params.from}
            initialToId={params.to}
            initialDate={params.date}
            initialPassengers={params.passengers}
            onSearch={handleSearch}
          />
        </div>

        {/* 7-day date strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <SearchDateStrip
            from={params.from}
            to={params.to}
            selectedDate={params.date}
            onSelectDate={handleDateSelect}
          />
        </div>
      </div>

      {/* ── CONTAINER 2: Results zone (white bg) ────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">

        {!searchEnabled ? (
          /* Pre-search empty state */
          <SearchEmptyState
            onQuickSearch={(c) => handleSearch({ ...c, passengers: params.passengers })}
          />
        ) : (
          <>
            {/* ── CONTAINER 3: Sort bar ───────────────────────────────── */}
            <SearchSortBar
              total={results?.total ?? 0}
              sort={params.sort}
              isLoading={isLoading}
              onSortChange={handleSortChange}
            />

            {/* ── CONTAINER 4: Filters + Results (flex row) ──────────── */}
            <div className="flex gap-6 mt-5 items-start">

              {/* Left: Filters sidebar (desktop only) */}
              <SearchFiltersSidebar
                {...filterProps}
                onOpenMobileFilters={() => setMobileFiltersOpen(true)}
              />

              {/* Right: Promo card + Trip results */}
              <div className="flex-1 min-w-0">
                <SearchPromoCard />
                <SearchResults
                  offers={allOffers}
                  isLoading={isLoading}
                  isLoadingMore={isLoadingMore}
                  hasNextPage={results?.hasNextPage ?? false}
                  date={params.date}
                  passengers={params.passengers}
                  onClearFilters={handleClearFilters}
                  onLoadMore={handleLoadMore}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Mobile filters bottom drawer ────────────────────────────────── */}
      <SearchMobileFilters
        {...filterProps}
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        activeFilterCount={activeFilterCount}
      />
      <BookingDialog />
    </div>
  );
}