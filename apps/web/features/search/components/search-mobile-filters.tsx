"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import { Button } from "@moja/ui/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { FiltersContent, type FiltersSidebarSharedProps } from "./search-filters-sidebar";

interface SearchMobileFiltersProps extends FiltersSidebarSharedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilterCount: number;
}

export function SearchMobileFilters({
  open,
  onOpenChange,
  activeFilterCount,
  ...filtersProps
}: SearchMobileFiltersProps) {
  return (
    <>
      {/* Floating trigger button — only on mobile */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-[#ee237c] text-white text-[10px] font-extrabold h-5 w-5 rounded-full flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Bottom sheet drawer */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-3xl px-5 pt-2 pb-0 flex flex-col"
        >
          {/* Drag handle */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 shrink-0" />

          <SheetHeader className="text-left mb-2 shrink-0">
            <SheetTitle className="font-montserrat font-bold text-slate-800">
              Filter Results
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto pr-1">
            <FiltersContent {...filtersProps} />
          </div>

          {/* Sticky apply button */}
          <div className="pt-4 pb-8 shrink-0 border-t border-slate-100 mt-2">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full h-12 rounded-full bg-[#ee237c] hover:bg-[#c71d65] text-white font-bold text-sm shadow-md shadow-pink-200/50 transition-all"
            >
              {activeFilterCount > 0
                ? `Apply ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""}`
                : "View Results"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
