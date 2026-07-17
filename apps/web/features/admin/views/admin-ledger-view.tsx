"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger } from "nuqs";
import { useTRPC } from "@/trpc/client";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { ledgerColumns } from "../components/ledger-columns";
import { LedgerTable } from "../components/ledger-table";
import { LedgerFilters } from "../components/ledger-filters";
import { LedgerKpiCards } from "../components/ledger-kpi-cards";
import { LedgerPagination } from "../components/ledger-pagination";

export function AdminLedgerView() {
  const trpc = useTRPC();

  // URL state query parameters synced via nuqs
  const [searchQuery, setSearchQuery] = useQueryState("q", { defaultValue: "" });
  const [sideFilter, setSideFilter] = useQueryState("side", { defaultValue: "ALL" });
  const [typeFilter, setTypeFilter] = useQueryState("type", { defaultValue: "ALL" });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState("pageSize", parseAsInteger.withDefault(10));

  const currentPageIndex = page - 1; // 0-indexed offset

  // Suspense query ledger entries
  const { data: ledgerData } = useSuspenseQuery(
    trpc.admin.listLedgerEntries.queryOptions({
      search: searchQuery || undefined,
      side: sideFilter === "ALL" ? undefined : (sideFilter as any),
      type: typeFilter === "ALL" ? undefined : typeFilter,
      limit: pageSize,
      offset: currentPageIndex * pageSize,
    })
  );

  const table = useReactTable({
    data: ledgerData?.items || [],
    columns: ledgerColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setSideFilter("ALL");
    setTypeFilter("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Metric KPI cards */}
      <LedgerKpiCards
        totalDebitVolume={ledgerData?.totalDebitVolume || BigInt(0)}
        totalCreditVolume={ledgerData?.totalCreditVolume || BigInt(0)}
        isBalanced={ledgerData?.isBalanced ?? true}
        totalEntries={ledgerData?.total || 0}
      />

      {/* Filter panel */}
      <LedgerFilters
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        sideFilter={sideFilter}
        onSideFilterChange={(val) => {
          setSideFilter(val);
          setPage(1);
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={(val) => {
          setTypeFilter(val);
          setPage(1);
        }}
        onClearFilters={handleClearFilters}
      />

      {/* Data Table */}
      <LedgerTable table={table} />

      {/* Custom pagination control footer */}
      <LedgerPagination
        page={page}
        pageSize={pageSize}
        total={ledgerData?.total || 0}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(1);
        }}
      />
    </div>
  );
}
