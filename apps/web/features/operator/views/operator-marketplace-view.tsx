"use client";

import { CIV_CITY_HUBS } from "@moja/schemas";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Slider } from "@moja/ui/components/ui/slider";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, SlidersHorizontal, Users, X } from "lucide-react";
import {
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useState } from "react";
import { DriverPublicProfileSheet } from "@/features/operator/components/drivers/driver-public-profile-sheet";
import {
  type MarketplaceDriver,
  MarketplaceDriverCard,
} from "@/features/operator/components/drivers/marketplace-driver-card";
import { SendOfferDialog } from "@/features/operator/components/drivers/send-offer-dialog";
import { useTRPC } from "@/trpc/client";

// ─── URL Search Params (nuqs) ─────────────────────────────────────────────────

const PAGE_SIZE = 18;

const marketplaceSearchParams = {
  licenseCategory: parseAsString.withDefault("ALL"),
  preferredType: parseAsString.withDefault("ALL"),
  cityBase: parseAsString.withDefault("ALL"),
  minRating: parseAsFloat.withDefault(0),
  minSafetyScore: parseAsInteger.withDefault(0),
};

// ─── Active Filter Count helper ───────────────────────────────────────────────

function countActiveFilters(
  lc: string,
  pt: string,
  cb: string,
  mr: number,
  ms: number,
) {
  return (
    (lc !== "ALL" ? 1 : 0) +
    (pt !== "ALL" ? 1 : 0) +
    (cb !== "ALL" ? 1 : 0) +
    (mr > 0 ? 1 : 0) +
    (ms > 0 ? 1 : 0)
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function MarketplaceEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="rounded-full bg-slate-100 p-5">
        <Users className="size-8 text-slate-400" />
      </div>
      <div>
        <p className="text-base font-bold text-slate-700">
          No drivers match your filters
        </p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Try widening your search area, changing the license category, or
          reducing the minimum rating and safety score requirements.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onClear} className="gap-2">
        <X className="size-4" />
        Clear all filters
      </Button>
    </div>
  );
}

// ─── Filter Popover (advanced: rating + safety sliders) ──────────────────────

interface AdvancedFilterProps {
  minRating: number;
  minSafetyScore: number;
  onChange: (rating: number, safety: number) => void;
}

function AdvancedFilterPopover({
  minRating,
  minSafetyScore,
  onChange,
}: AdvancedFilterProps) {
  const [localRating, setLocalRating] = useState(minRating);
  const [localSafety, setLocalSafety] = useState(minSafetyScore);
  const [open, setOpen] = useState(false);

  const activeCount = (minRating > 0 ? 1 : 0) + (minSafetyScore > 0 ? 1 : 0);

  const handleApply = () => {
    onChange(localRating, localSafety);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalRating(0);
    setLocalSafety(0);
    onChange(0, 0);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setLocalRating(minRating);
          setLocalSafety(minSafetyScore);
        }
        setOpen(v);
      }}
    >
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2 relative">
            <SlidersHorizontal className="size-4" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5">
                {activeCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-72 space-y-5 p-5">
        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            Advanced Filters
          </h4>
          <p className="text-xs text-slate-500">
            Filter by driver quality metrics.
          </p>
        </div>

        {/* Minimum Rating Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Minimum Rating</Label>
            <span className="text-xs font-bold text-primary">
              {localRating > 0 ? `≥ ${localRating.toFixed(1)} ★` : "Any"}
            </span>
          </div>
          <Slider
            min={0}
            max={5}
            step={0.5}
            value={[localRating]}
            onValueChange={(vals) =>
              setLocalRating(Array.isArray(vals) ? (vals[0] ?? 0) : vals)
            }
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Any</span>
            <span>4.0</span>
            <span>5.0 ★</span>
          </div>
        </div>

        {/* Minimum Safety Score Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">
              Minimum Safety Score
            </Label>
            <span className="text-xs font-bold text-primary">
              {localSafety > 0 ? `≥ ${localSafety}` : "Any"}
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[localSafety]}
            onValueChange={(vals) =>
              setLocalSafety(Array.isArray(vals) ? (vals[0] ?? 0) : vals)
            }
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Any</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* Apply / Reset */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button size="sm" className="flex-1 text-xs" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function OperatorMarketplaceView() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<MarketplaceDriver[]>([]);
  const [profileSheetId, setProfileSheetId] = useState<string | null>(null);
  const [offerTarget, setOfferTarget] = useState<MarketplaceDriver | null>(
    null,
  );
  const [lastFilters, setLastFilters] = useState("");

  const [params, setParams] = useQueryStates(marketplaceSearchParams);
  const {
    licenseCategory,
    preferredType,
    cityBase,
    minRating,
    minSafetyScore,
  } = params;

  const filterKey = `${licenseCategory}|${preferredType}|${cityBase}|${minRating}|${minSafetyScore}`;

  const activeFilterCount = countActiveFilters(
    licenseCategory,
    preferredType,
    cityBase,
    minRating,
    minSafetyScore,
  );

  const resetAllFilters = () => {
    setParams({
      licenseCategory: "ALL",
      preferredType: "ALL",
      cityBase: "ALL",
      minRating: 0,
      minSafetyScore: 0,
    });
    setPage(1);
    setAccumulated([]);
  };

  const queryOptions = {
    licenseCategory:
      licenseCategory !== "ALL"
        ? (licenseCategory as "B" | "C" | "D" | "E")
        : undefined,
    preferredType:
      preferredType !== "ALL"
        ? (preferredType as
            | "EXCLUSIVE_INTERCITY"
            | "CONTRACTOR_URBAN"
            | "HYBRID")
        : undefined,
    cityBase: cityBase !== "ALL" ? cityBase : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    minSafetyScore: minSafetyScore > 0 ? minSafetyScore : undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useQuery({
    ...trpc.drivers.listMarketplaceDrivers.queryOptions(queryOptions),
    placeholderData: (prev) => prev,
  });

  // Reset accumulation when filters change
  if (filterKey !== lastFilters && !isLoading) {
    setLastFilters(filterKey);
    setAccumulated([]);
  }

  const incoming = (data?.drivers ?? []) as unknown as MarketplaceDriver[];
  const total = data?.total ?? 0;

  // Merge incoming page into accumulated without duplicates
  const knownIds = new Set(accumulated.map((d) => d.id));
  const newOnes = incoming.filter((d) => !knownIds.has(d.id));
  const displayDrivers = page === 1 ? incoming : [...accumulated, ...newOnes];
  const isEmpty = !isLoading && displayDrivers.length === 0;
  const hasMore = displayDrivers.length < total;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Driver Marketplace
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse {total > 0 ? `${total} ` : ""}verified, available commercial
            drivers.
          </p>
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAllFilters}
            className="gap-2 text-xs"
          >
            <X className="size-3.5" />
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-card">
        {/* License Category */}
        <Select
          value={licenseCategory}
          onValueChange={(v) => {
            setParams({ licenseCategory: v });
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="License Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Classes</SelectItem>
            <SelectItem value="D">Class D (Bus)</SelectItem>
            <SelectItem value="C">Class C (Heavy)</SelectItem>
            <SelectItem value="E">Class E (Coach)</SelectItem>
            <SelectItem value="B">Class B (Van)</SelectItem>
          </SelectContent>
        </Select>

        {/* Employment Type */}
        <Select
          value={preferredType}
          onValueChange={(v) => {
            setParams({ preferredType: v });
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44 h-9 text-xs">
            <SelectValue placeholder="Employment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="EXCLUSIVE_INTERCITY">
              Exclusive Intercity
            </SelectItem>
            <SelectItem value="CONTRACTOR_URBAN">Urban Contractor</SelectItem>
            <SelectItem value="HYBRID">Hybrid</SelectItem>
          </SelectContent>
        </Select>

        {/* City Base */}
        <Select
          value={cityBase}
          onValueChange={(v) => {
            setParams({ cityBase: v });
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44 h-9 text-xs">
            <SelectValue placeholder="City / Hub" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Cities</SelectItem>
            {CIV_CITY_HUBS.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters (Rating + Safety sliders) */}
        <AdvancedFilterPopover
          minRating={minRating}
          minSafetyScore={minSafetyScore}
          onChange={(rating, safety) => {
            setParams({ minRating: rating, minSafetyScore: safety });
            setPage(1);
          }}
        />

        {/* Result count */}
        <div className="ml-auto text-xs text-muted-foreground">
          {isLoading
            ? "Loading..."
            : `${total} driver${total !== 1 ? "s" : ""} found`}
        </div>
      </div>

      {/* Driver Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Skeletons while loading
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-border bg-card animate-pulse"
            />
          ))
        ) : isEmpty ? (
          <MarketplaceEmptyState onClear={resetAllFilters} />
        ) : (
          displayDrivers.map((driver) => (
            <MarketplaceDriverCard
              key={driver.id}
              driver={driver}
              onViewProfile={(id) => setProfileSheetId(id)}
              onSendOffer={(d) => setOfferTarget(d)}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {!isLoading && hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setAccumulated(displayDrivers);
              setPage((p) => p + 1);
            }}
            disabled={isFetching}
            className="gap-2 min-w-36"
          >
            {isFetching ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load more (${total - displayDrivers.length} remaining)`
            )}
          </Button>
        </div>
      )}

      {/* Driver Profile Sheet */}
      <DriverPublicProfileSheet
        driverProfileId={profileSheetId}
        open={!!profileSheetId}
        onOpenChange={(open) => {
          if (!open) setProfileSheetId(null);
        }}
      />

      {/* Send Offer Dialog */}
      <SendOfferDialog
        driverProfileId={offerTarget?.id ?? null}
        driverName={offerTarget?.user.fullName ?? "this driver"}
        licenseCategory={offerTarget?.licenseCategory}
        open={!!offerTarget}
        onOpenChange={(open) => {
          if (!open) setOfferTarget(null);
        }}
      />
    </div>
  );
}
