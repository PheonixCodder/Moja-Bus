"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { useTRPC } from "@/trpc/client";
import { searchParamsSchema, type SearchSortOption } from "../lib/params";
import type { TimeFilterId, SeatClassFilter } from "./search-filters-sidebar";
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
import { toast } from "sonner";
import type { RouterOutputs } from "@/trpc/client";

const FILTER_STORAGE_KEY = "search_filters";

interface StoredFilters {
  operators: string[];
  amenities: string[];
  departureTime: TimeFilterId[];
  seatClass: SeatClassFilter[];
  isExpress: boolean;
  maxPrice?: number;
}

function persistFilters(filters: StoredFilters) {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters)); } catch {}
}

function restoreFilters(): StoredFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

type SearchOffer = RouterOutputs["search"]["search"]["offers"][number];

const RESUME_TOAST_KEY = "moja:search-resume-toast";

interface SearchPageClientProps {
  user?: any;
}

export function SearchPageClient({ user }: SearchPageClientProps) {
  const t = useTranslations("search");
  const trpc = useTRPC();

  const [params, setParams] = useQueryStates(searchParamsSchema, {
    shallow: true,
    history: "push",
  });

  const [localFilters, setLocalFilters] = useState<StoredFilters>(() => {
    return restoreFilters() ?? {
      operators: [],
      amenities: [],
      departureTime: [],
      seatClass: [],
      isExpress: false,
    };
  });

  const searchEnabled = !!params.from && !!params.to && !!params.date;

  useEffect(() => {
    if (!user?.id) return;
    if (!params.bookingOfferId) return;
    if (typeof window === "undefined") return;
    const key = `${RESUME_TOAST_KEY}:${params.bookingOfferId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore storage failures
    }
    toast.success(t("resumeToast"));
  }, [user?.id, params.bookingOfferId]);

  // Prefetch passenger data when user is known (speeds up checkout form)
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user?.id) return;
    queryClient.prefetchQuery(trpc.passenger.listSaved.queryOptions());
    queryClient.prefetchQuery(trpc.passenger.getWalletBalance.queryOptions());
  }, [user?.id]);

  // Mobile filters drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ─── Search query ─────────────────────────────────────────────────────────
  const { data: results, isLoading, isFetching } = useQuery({
    ...trpc.search.search.queryOptions({
      originCityId: params.from,
      destinationCityId: params.to,
      originMunicipalityId: params.fromMuni || undefined,
      destinationMunicipalityId: params.toMuni || undefined,
      originQuarterId: params.fromQuarter || undefined,
      destinationQuarterId: params.toQuarter || undefined,
      date: params.date,
      passengers: params.passengers,
      operators: localFilters.operators.length > 0 ? localFilters.operators : undefined,
      amenities: localFilters.amenities.length > 0 ? localFilters.amenities : undefined,
      departureTime: localFilters.departureTime.length > 0 ? localFilters.departureTime : undefined,
      seatClass: localFilters.seatClass.length > 0 ? localFilters.seatClass as ("ECONOMY" | "STANDARD" | "VIP")[] : undefined,
      maxPrice: localFilters.maxPrice ?? undefined,
      isExpress: localFilters.isExpress ? ["true"] : undefined,
      sort: params.sort,
      page: params.page,
    }),
    enabled: searchEnabled,
    staleTime: 10 * 1000,
  });

  // ─── Accumulated offers (for Load More) ──────────────────────────────────
  const [allOffers, setAllOffers] = useState<SearchOffer[]>([]);
  const prevCriteriaKey = useRef("");
  const isLoadingMore = isFetching && params.page > 1;

  // Criteria key excludes `page` — changes to this key reset the list
  const criteriaKey = [
    params.from,
    params.to,
    params.fromMuni,
    params.toMuni,
    params.fromQuarter,
    params.toQuarter,
    params.date,
    params.passengers,
    localFilters.operators.join(","),
    localFilters.amenities.join(","),
    localFilters.departureTime.join(","),
    localFilters.seatClass.join(","),
    localFilters.isExpress ? "express" : "",
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
    localFilters.operators.length +
    localFilters.amenities.length +
    localFilters.departureTime.length +
    localFilters.seatClass.length +
    (localFilters.isExpress ? 1 : 0);

  // ─── Handlers (memoized) ────────────────────────────────────────────────
  const handleSearch = useCallback((criteria: {
    from: string;
    to: string;
    fromMuni: string;
    toMuni: string;
    fromQuarter: string;
    toQuarter: string;
    date: string;
    passengers: number;
  }) => {
    const cleared = { operators: [], amenities: [], departureTime: [], seatClass: [], isExpress: false };
    setLocalFilters(cleared);
    persistFilters(cleared);

    void setParams({
      from: criteria.from,
      to: criteria.to,
      fromMuni: criteria.fromMuni,
      toMuni: criteria.toMuni,
      fromQuarter: criteria.fromQuarter,
      toQuarter: criteria.toQuarter,
      date: criteria.date,
      passengers: criteria.passengers,
      page: 1,
      bookingOfferId: null,
    });
  }, [setParams]);

  const handleDateSelect = useCallback((date: string) => {
    void setParams({ date, page: 1 });
  }, [setParams]);

  const handleToggleOperator = useCallback((id: string) => {
    setLocalFilters((prev) => {
      const operators = prev.operators.includes(id)
        ? prev.operators.filter((o) => o !== id)
        : [...prev.operators, id];
      const next = { ...prev, operators };
      persistFilters(next);
      return next;
    });
    setParams((prev) => ({ ...prev, page: 1 }));
  }, [setParams]);

  const handleToggleAmenity = useCallback((id: string) => {
    setLocalFilters((prev) => {
      const amenities = prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id];
      const next = { ...prev, amenities };
      persistFilters(next);
      return next;
    });
    setParams((prev) => ({ ...prev, page: 1 }));
  }, [setParams]);

  const handleToggleTime = useCallback((id: TimeFilterId) => {
    setLocalFilters((prev) => {
      const departureTime = prev.departureTime.includes(id)
        ? prev.departureTime.filter((t) => t !== id)
        : [...prev.departureTime, id];
      const next = { ...prev, departureTime };
      persistFilters(next);
      return next;
    });
    setParams((prev) => ({ ...prev, page: 1 }));
  }, [setParams]);

  const handleToggleSeatClass = useCallback((id: SeatClassFilter) => {
    setLocalFilters((prev) => {
      const seatClass = prev.seatClass.includes(id)
        ? prev.seatClass.filter((s) => s !== id)
        : [...prev.seatClass, id];
      const next = { ...prev, seatClass };
      persistFilters(next);
      return next;
    });
    setParams((prev) => ({ ...prev, page: 1 }));
  }, [setParams]);

  const handleToggleExpress = useCallback(() => {
    setLocalFilters((prev) => {
      const next = { ...prev, isExpress: !prev.isExpress };
      persistFilters(next);
      return next;
    });
    setParams((prev) => ({ ...prev, page: 1 }));
  }, [setParams]);

  const handleClearFilters = useCallback(() => {
    const cleared: StoredFilters = { operators: [], amenities: [], departureTime: [], seatClass: [], isExpress: false };
    setLocalFilters(cleared);
    persistFilters(cleared);
    setParams((prev) => ({ ...prev, sort: "BEST", page: 1 }));
  }, [setParams]);

  const handleSortChange = useCallback((sort: string) => {
    void setParams({ sort: sort as SearchSortOption, page: 1 });
  }, [setParams]);

  const handleLoadMore = useCallback(() => {
    setParams((prev) => ({ ...prev, page: prev.page + 1 }));
  }, [setParams]);

  const filterProps = useMemo(() => ({
    operators: localFilters.operators,
    amenities: localFilters.amenities,
    departureTime: localFilters.departureTime,
    seatClass: localFilters.seatClass,
    isExpress: localFilters.isExpress,
    activeOperators,
    onToggleOperator: handleToggleOperator,
    onToggleAmenity: handleToggleAmenity,
    onToggleTime: handleToggleTime,
    onToggleSeatClass: handleToggleSeatClass,
    onToggleExpress: handleToggleExpress,
    onClear: handleClearFilters,
  }), [
    localFilters.operators,
    localFilters.amenities,
    localFilters.departureTime,
    localFilters.seatClass,
    localFilters.isExpress,
    activeOperators,
    handleToggleOperator,
    handleToggleAmenity,
    handleToggleTime,
    handleToggleSeatClass,
    handleToggleExpress,
    handleClearFilters,
  ]);

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
            initialFromMuni={params.fromMuni}
            initialToMuni={params.toMuni}
            initialFromQuarter={params.fromQuarter}
            initialToQuarter={params.toQuarter}
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
            {...(params.fromMuni || params.toMuni || params.fromQuarter || params.toQuarter
              ? {
                  fromMuni: params.fromMuni,
                  toMuni: params.toMuni,
                  fromQuarter: params.fromQuarter,
                  toQuarter: params.toQuarter,
                }
              : {})}
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
            onQuickSearch={(c) => handleSearch({ ...c, fromMuni: "", toMuni: "", fromQuarter: "", toQuarter: "", passengers: params.passengers })}
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