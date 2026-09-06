"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("adminDashboard.ledgerFilters");
  const hasActiveFilters =
    searchQuery !== "" || sideFilter !== "ALL" || typeFilter !== "ALL";

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-card border border-border rounded-lg p-4 shadow-sm">
      {/* Search Input */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 text-xs bg-muted/40 transition-colors"
        />
      </div>

      {/* Filters selectors */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Select
          value={sideFilter}
          onValueChange={(val: string | null) => onSideFilterChange(val || "ALL")}
        >
          <SelectTrigger className="h-10 w-32 text-xs font-semibold">
            <SelectValue placeholder={t("allSides")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">{t("allSides")}</SelectItem>
              <SelectItem value="DEBIT">{t("debitEntries")}</SelectItem>
              <SelectItem value="CREDIT">{t("creditEntries")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(val: string | null) => onTypeFilterChange(val || "ALL")}
        >
          <SelectTrigger className="h-10 w-40 text-xs font-semibold">
            <SelectValue placeholder={t("allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">{t("allTypes")}</SelectItem>
              <SelectItem value="BOOKING">{t("booking")}</SelectItem>
              <SelectItem value="TOP_UP">{t("walletTopUp")}</SelectItem>
              <SelectItem value="REFUND">{t("refund")}</SelectItem>
              <SelectItem value="OPERATOR_PAYOUT">
                {t("operatorPayout")}
              </SelectItem>
              <SelectItem value="PAYOUT_REVERSAL">
                {t("payoutReversal")}
              </SelectItem>
              <SelectItem value="SETTLEMENT">{t("settlement")}</SelectItem>
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
          className="h-10 text-xs text-muted-foreground hover:text-foreground font-semibold gap-1.5 ml-auto shrink-0"
        >
          <SlidersHorizontal className="size-3.5" />
          {t("clearFilters")}
        </Button>
      )}
    </div>
  );
}
