"use client";

import { Filter } from "lucide-react";
import { Separator } from "@moja/ui/components/ui/separator";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { Slider } from "@moja/ui/components/ui/slider";
import { AMENITY_OPTIONS, DEPARTURE_TIME_OPTIONS, PRICE_RANGE } from "../lib/constants";
import { formatPriceXOF } from "../lib/format";

interface OperatorOption {
  id: string;
  name: string;
}

interface SearchFiltersSidebarProps {
  operators: string[];
  amenities: string[];
  departureTime: ("MORNING" | "AFTERNOON" | "EVENING")[];
  maxPrice: number | null;
  activeOperators: OperatorOption[];
  onToggleOperator: (id: string) => void;
  onToggleAmenity: (id: string) => void;
  onToggleTime: (id: "MORNING" | "AFTERNOON" | "EVENING") => void;
  onMaxPriceChange: (value: number) => void;
  onClear: () => void;
}

export function SearchFiltersSidebar({
  operators,
  amenities,
  departureTime,
  maxPrice,
  activeOperators,
  onToggleOperator,
  onToggleAmenity,
  onToggleTime,
  onMaxPriceChange,
  onClear,
}: SearchFiltersSidebarProps) {
  return (
    <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold font-montserrat flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#ee237c]" /> Filter Results
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

      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Bus Operator
        </h4>
        <div className="space-y-2">
          {activeOperators.map((op) => (
            <div key={op.id} className="flex items-center gap-2">
              <Checkbox
                id={`op-${op.id}`}
                checked={operators.includes(op.id)}
                onCheckedChange={() => onToggleOperator(op.id)}
                className="border-slate-300 data-[state=checked]:bg-[#ee237c] data-[state=checked]:border-[#ee237c]"
              />
              <label htmlFor={`op-${op.id}`} className="text-sm font-semibold text-slate-600 cursor-pointer select-none">
                {op.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Amenities
        </h4>
        <div className="space-y-2">
          {AMENITY_OPTIONS.map((amenity) => (
            <div key={amenity.id} className="flex items-center gap-2">
              <Checkbox
                id={`am-${amenity.id}`}
                checked={amenities.includes(amenity.id)}
                onCheckedChange={() => onToggleAmenity(amenity.id)}
                className="border-slate-300 data-[state=checked]:bg-[#ee237c] data-[state=checked]:border-[#ee237c]"
              />
              <label htmlFor={`am-${amenity.id}`} className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer select-none">
                <amenity.icon className="h-3.5 w-3.5 text-slate-400" />
                {amenity.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Departure Time
        </h4>
        <div className="space-y-2">
          {DEPARTURE_TIME_OPTIONS.map((time) => (
            <div key={time.id} className="flex items-center gap-2">
              <Checkbox
                id={`time-${time.id}`}
                checked={departureTime.includes(time.id)}
                onCheckedChange={() => onToggleTime(time.id)}
                className="border-slate-300 data-[state=checked]:bg-[#ee237c] data-[state=checked]:border-[#ee237c]"
              />
              <label htmlFor={`time-${time.id}`} className="text-sm font-semibold text-slate-600 cursor-pointer select-none">
                {time.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex justify-between">
          <span>Max Price</span>
          <span className="text-[#ee237c] lowercase">
            {maxPrice ? formatPriceXOF(maxPrice) : "Any"}
          </span>
        </h4>
        <Slider
          min={PRICE_RANGE.min}
          max={PRICE_RANGE.max}
          step={PRICE_RANGE.step}
          value={[maxPrice || PRICE_RANGE.max]}
          onValueChange={(val) => onMaxPriceChange(Array.isArray(val) ? val[0]! : val)}
          className="py-2"
        />
        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>{formatPriceXOF(PRICE_RANGE.min)}</span>
          <span>{formatPriceXOF(PRICE_RANGE.max)}</span>
        </div>
      </div>
    </aside>
  );
}