"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import { Separator } from "@moja/ui/components/ui/separator";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { DEPARTURE_TIME_OPTIONS } from "../lib/constants";

export type TimeFilterId = "MORNING" | "AFTERNOON" | "EVENING" | "LATE_NIGHT";
export type SeatClassFilter = "ECONOMY" | "STANDARD" | "VIP";

const AMENITY_IDS = ["AC", "WIFI", "TOILET", "LUGGAGE"] as const;
const TIME_IDS: TimeFilterId[] = [
  "MORNING",
  "AFTERNOON",
  "EVENING",
  "LATE_NIGHT",
];
const SEAT_CLASS_IDS: SeatClassFilter[] = ["ECONOMY", "STANDARD", "VIP"];

export interface OperatorOption {
  id: string;
  name: string;
}

export interface FiltersSidebarSharedProps {
  operators: string[];
  amenities: string[];
  departureTime: TimeFilterId[];
  seatClass: SeatClassFilter[];
  isExpress: boolean;
  activeOperators: OperatorOption[];
  onToggleOperator: (id: string) => void;
  onToggleAmenity: (id: string) => void;
  onToggleTime: (id: TimeFilterId) => void;
  onToggleSeatClass: (id: SeatClassFilter) => void;
  onToggleExpress: () => void;
  onClear: () => void;
}

interface SearchFiltersSidebarProps extends FiltersSidebarSharedProps {
  onOpenMobileFilters: () => void;
}

/** Shared filter content — used inside both the desktop sidebar and mobile drawer */
export const FiltersContent = memo(function FiltersContent({
  operators,
  amenities,
  departureTime,
  seatClass,
  isExpress,
  activeOperators,
  onToggleOperator,
  onToggleAmenity,
  onToggleTime,
  onToggleSeatClass,
  onToggleExpress,
  onClear,
}: FiltersSidebarSharedProps) {
  const t = useTranslations("search");

  const amenityLabels: Record<string, string> = {
    AC: t("amenityAC"),
    WIFI: t("amenityWIFI"),
    TOILET: t("amenityTOILET"),
    LUGGAGE: t("amenityLUGGAGE"),
  };

  const timeLabels: Record<TimeFilterId, string> = {
    MORNING: t("timeMORNING"),
    AFTERNOON: t("timeAFTERNOON"),
    EVENING: t("timeEVENING"),
    LATE_NIGHT: t("timeLATE_NIGHT"),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold font-montserrat flex items-center gap-2 text-slate-800">
          <Filter className="h-4 w-4 text-[#ee237c]" />
          {t("filtersTitle")}
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
        >
          {t("clearAll")}
        </button>
      </div>

      <Separator className="bg-slate-100" />

      {activeOperators.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
            {t("busOperator")}
          </h4>
          <div className="space-y-2.5">
            {activeOperators.map((op) => (
              <div key={op.id} className="flex items-center gap-2.5">
                <Checkbox
                  id={`op-${op.id}`}
                  checked={operators.includes(op.id)}
                  onCheckedChange={() => onToggleOperator(op.id)}
                  className="border-slate-300 data-[state=checked]:bg-[#ee237c] data-[state=checked]:border-[#ee237c]"
                />
                <label
                  htmlFor={`op-${op.id}`}
                  className="text-sm font-semibold text-slate-600 cursor-pointer select-none leading-none"
                >
                  {op.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
          {t("filters.amenities")}
        </h4>
        <div className="space-y-2.5">
          {AMENITY_IDS.map((id) => (
            <div key={id} className="flex items-center gap-2.5">
              <Checkbox
                id={`am-${id}`}
                checked={amenities.includes(id)}
                onCheckedChange={() => onToggleAmenity(id)}
                className="border-slate-300 data-[state=checked]:bg-[#ee237c] data-[state=checked]:border-[#ee237c]"
              />
              <label
                htmlFor={`am-${id}`}
                className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer select-none leading-none"
              >
                {amenityLabels[id]}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
          {t("filters.departure")}
        </h4>
        <div className="space-y-2.5">
          {TIME_IDS.map((id) => (
            <div key={id} className="flex items-center gap-2.5">
              <Checkbox
                id={`time-${id}`}
                checked={departureTime.includes(id)}
                onCheckedChange={() => onToggleTime(id)}
                className="border-slate-300 data-[state=checked]:bg-[#ee237c] data-[state=checked]:border-[#ee237c]"
              />
              <label
                htmlFor={`time-${id}`}
                className="text-sm font-semibold text-slate-600 cursor-pointer select-none leading-none"
              >
                {timeLabels[id]}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
          {t("filters.busClass")}
        </h4>
        <div className="space-y-2.5">
          {SEAT_CLASS_IDS.map((id) => (
            <div key={id} className="flex items-center gap-2.5">
              <Checkbox
                id={`class-${id}`}
                checked={seatClass.includes(id)}
                onCheckedChange={() => onToggleSeatClass(id)}
                className="border-slate-300 data-[state=checked]:bg-[#ee237c] data-[state=checked]:border-[#ee237c]"
              />
              <label
                htmlFor={`class-${id}`}
                className="text-sm font-semibold text-slate-600 cursor-pointer select-none leading-none"
              >
                {t(`seatClass.${id}`)}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
          {t("filters.tripType")}
        </h4>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="express"
              checked={isExpress}
              onCheckedChange={onToggleExpress}
              className="border-slate-300 data-[state=checked]:bg-[#ee237c] data-[state=checked]:border-[#ee237c]"
            />
            <label
              htmlFor="express"
              className="text-sm font-semibold text-slate-600 cursor-pointer select-none leading-none"
            >
              {t("filters.express")}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
});

/** Desktop sticky sidebar — hidden on mobile (<lg) */
export const SearchFiltersSidebar = memo(function SearchFiltersSidebar(
  props: SearchFiltersSidebarProps,
) {
  const { onOpenMobileFilters: _unused, ...filtersProps } = props;

  return (
    <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-24 self-start bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <FiltersContent {...filtersProps} />
    </aside>
  );
});
