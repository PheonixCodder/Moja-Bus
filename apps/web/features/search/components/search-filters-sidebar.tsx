"use client";

import { Filter } from "lucide-react";
import { Separator } from "@moja/ui/components/ui/separator";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { AMENITY_OPTIONS, DEPARTURE_TIME_OPTIONS } from "../lib/constants";

export interface OperatorOption {
  id: string;
  name: string;
}

export interface FiltersSidebarSharedProps {
  operators: string[];
  amenities: string[];
  departureTime: ("MORNING" | "AFTERNOON" | "EVENING")[];
  activeOperators: OperatorOption[];
  onToggleOperator: (id: string) => void;
  onToggleAmenity: (id: string) => void;
  onToggleTime: (id: "MORNING" | "AFTERNOON" | "EVENING") => void;
  onClear: () => void;
}

interface SearchFiltersSidebarProps extends FiltersSidebarSharedProps {
  onOpenMobileFilters: () => void;
}

/** Shared filter content — used inside both the desktop sidebar and mobile drawer */
export function FiltersContent({
  operators,
  amenities,
  departureTime,
  activeOperators,
  onToggleOperator,
  onToggleAmenity,
  onToggleTime,
  onClear,
}: FiltersSidebarSharedProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold font-montserrat flex items-center gap-2 text-slate-800">
          <Filter className="h-4 w-4 text-[#ee237c]" />
          Filter Results
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
        >
          Clear All
        </button>
      </div>

      <Separator className="bg-slate-100" />

      {/* Bus Operator */}
      {activeOperators.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
            Bus Operator
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

      {/* Amenities */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
          Amenities
        </h4>
        <div className="space-y-2.5">
          {AMENITY_OPTIONS.map((amenity) => (
            <div key={amenity.id} className="flex items-center gap-2.5">
              <Checkbox
                id={`am-${amenity.id}`}
                checked={amenities.includes(amenity.id)}
                onCheckedChange={() => onToggleAmenity(amenity.id)}
                className="border-slate-300 data-[state=checked]:bg-[#ee237c] data-[state=checked]:border-[#ee237c]"
              />
              <label
                htmlFor={`am-${amenity.id}`}
                className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer select-none leading-none"
              >
                <amenity.icon className="h-3.5 w-3.5 text-slate-400" />
                {amenity.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Departure Time */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
          Departure Time
        </h4>
        <div className="space-y-2.5">
          {DEPARTURE_TIME_OPTIONS.map((time) => (
            <div key={time.id} className="flex items-center gap-2.5">
              <Checkbox
                id={`time-${time.id}`}
                checked={departureTime.includes(time.id)}
                onCheckedChange={() => onToggleTime(time.id)}
                className="border-slate-300 data-[state=checked]:bg-[#ee237c] data-[state=checked]:border-[#ee237c]"
              />
              <label
                htmlFor={`time-${time.id}`}
                className="text-sm font-semibold text-slate-600 cursor-pointer select-none leading-none"
              >
                {time.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Desktop sticky sidebar — hidden on mobile (<lg) */
export function SearchFiltersSidebar(props: SearchFiltersSidebarProps) {
  const { onOpenMobileFilters: _unused, ...filtersProps } = props;

  return (
    <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-24 self-start bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <FiltersContent {...filtersProps} />
    </aside>
  );
}