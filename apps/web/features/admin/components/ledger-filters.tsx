"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Button } from "@moja/ui/components/ui/button";

interface LedgerFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  sideFilter: string;
  onSideFilterChange: (val: string) => void;
  typeFilter: string;
  onTypeFilterChange: (val: string) => void;
  onClearFilters: () => void;
}

export function LedgerFilters({
  searchQuery,
  onSearchChange,
  sideFilter,
  onSideFilterChange,
  typeFilter,
  onTypeFilterChange,
  onClearFilters,
}: LedgerFiltersProps) {
  const hasActiveFilters = searchQuery !== "" || sideFilter !== "ALL" || typeFilter !== "ALL";

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-border rounded-lg p-4 shadow-sm">
      {/* Search Input */}
      <div className="relative w-full sm:w-[280px]">
        <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
        <Input
          placeholder="Search by description, reference..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 border-slate-200 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-colors"
        />
      </div>

      {/* Filters selectors */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Select value={sideFilter} onValueChange={(val) => onSideFilterChange(val || "ALL")}>
          <SelectTrigger className="h-10 w-[120px] text-xs font-semibold bg-white border border-slate-200">
            <SelectValue placeholder="All Sides" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-border shadow-md rounded">
            <SelectGroup>
              <SelectItem value="ALL">All Sides</SelectItem>
              <SelectItem value="DEBIT">Debit Entries</SelectItem>
              <SelectItem value="CREDIT">Credit Entries</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(val) => onTypeFilterChange(val || "ALL")}>
          <SelectTrigger className="h-10 w-[160px] text-xs font-semibold bg-white border border-slate-200">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-border shadow-md rounded">
            <SelectGroup>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="BOOKING">Booking</SelectItem>
              <SelectItem value="TOP_UP">Wallet Top Up</SelectItem>
              <SelectItem value="REFUND">Refund</SelectItem>
              <SelectItem value="OPERATOR_PAYOUT">Operator Payout</SelectItem>
              <SelectItem value="PAYOUT_REVERSAL">Payout Reversal</SelectItem>
              <SelectItem value="SETTLEMENT">Settlement</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-10 text-xs text-slate-500 hover:text-slate-700 font-semibold gap-1.5 ml-auto shrink-0"
        >
          <SlidersHorizontal className="size-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
