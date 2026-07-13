"use client";

import { cn } from "@moja/ui/lib/utils";
import { TrendingDown, Zap, Clock, MoonStar } from "lucide-react";

interface SortOption {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const SORT_OPTIONS: SortOption[] = [
  { key: "CHEAPEST", label: "Cheapest", icon: <TrendingDown className="h-3.5 w-3.5" /> },
  { key: "FASTEST",  label: "Fastest",  icon: <Zap className="h-3.5 w-3.5" /> },
  { key: "EARLIEST", label: "Earliest", icon: <Clock className="h-3.5 w-3.5" /> },
  { key: "LATEST",   label: "Latest",   icon: <MoonStar className="h-3.5 w-3.5" /> },
];

interface SearchSortBarProps {
  total: number;
  sort: string;
  isLoading: boolean;
  onSortChange: (sort: string) => void;
}

export function SearchSortBar({ total, sort, isLoading, onSortChange }: SearchSortBarProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100">
      {/* Left: result count */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
          Select your trip
        </p>
        {isLoading ? (
          <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
        ) : (
          <p className="text-lg font-bold text-slate-800">
            {total.toLocaleString()}{" "}
            <span className="text-slate-500 font-medium text-base">
              {total === 1 ? "result" : "results"}
            </span>
          </p>
        )}
      </div>

      {/* Right: sort pills */}
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:block">
          Sort by
        </span>
        {SORT_OPTIONS.map((opt) => {
          const isActive = sort === opt.key || (sort === "BEST" && opt.key === "CHEAPEST");
          return (
            <button
              key={opt.key}
              onClick={() => onSortChange(opt.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 border",
                isActive
                  ? "bg-[#ee237c] text-white border-[#ee237c] shadow-sm shadow-pink-200"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#ee237c]/50 hover:text-[#ee237c]",
              )}
              aria-pressed={isActive}
            >
              {opt.icon}
              <span className="hidden sm:inline">{opt.label}</span>
              <span className="sm:hidden">{opt.label.slice(0, 4)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
