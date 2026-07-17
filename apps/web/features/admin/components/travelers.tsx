"use client";
"use no memo";

import * as React from "react";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Grid, Rows3, Search, Users } from "lucide-react";

import { Button } from "@moja/ui/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@moja/ui/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@moja/ui/components/ui/tabs";

import { type TravelerRow, statusMeta, getAvatarTone, getInitials, travelersColumns } from "./travelers-columns";
import { TravelersTable } from "./travelers-table";
import { TravelersGrid } from "./travelers-grid";
import { useQueryStates } from "nuqs";
import { travelerSearchParams } from "../lib/search-params";

export function Travelers({ travelers }: { travelers: TravelerRow[] }) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "joinedDate", desc: true }]);
  const [params, setParams] = useQueryStates(travelerSearchParams);
  const viewType = params.view;

  const columnFilters = React.useMemo(() => {
    const filters: ColumnFiltersState = [];
    if (params.search) filters.push({ id: "search", value: params.search });
    if (params.status && params.status !== "All") filters.push({ id: "status", value: params.status });
    return filters;
  }, [params.search, params.status]);
  
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: viewType === "list" ? 10 : 12,
  });

  const table = useReactTable({
    data: travelers,
    columns: travelersColumns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // Handle switching views to adjust page size
  function handleViewChange(value: string) {
    const newView = value as "list" | "grid";
    setParams({ view: newView });
    if (newView === "grid" && table.getState().pagination.pageSize === 10) {
      table.setPageSize(12);
    } else if (newView === "list" && table.getState().pagination.pageSize === 12) {
      table.setPageSize(10);
    }
  }

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="border-b border-border bg-card pb-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl leading-none flex items-center gap-2">
              <Users className="size-5 text-sidebar-primary" />
              Travelers Directory
            </CardTitle>
            <CardDescription className="max-w-sm leading-snug">
              Manage all passenger accounts across the platform.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search travelers..."
                className="pl-8 h-9"
                value={params.search}
                onChange={(event) => {
                  setParams({ search: event.target.value || "" });
                  table.setPageIndex(0);
                }}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-2 size-4" /> Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4 p-0 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={params.status} onValueChange={(value) => {
                setParams({ status: value as any });
                table.setPageIndex(0);
              }}>
              <SelectTrigger size="sm" className="h-8 w-[140px]">
                <span className="text-muted-foreground">Status:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Unverified">Unverified</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 pb-2">
          <div className="text-muted-foreground text-sm tabular-nums">
            {selectedCount > 0 ? `${selectedCount} selected` : `${travelers.length} total travelers`}
          </div>

          <Tabs value={viewType} onValueChange={handleViewChange}>
            <TabsList className="h-8">
              <TabsTrigger value="list" aria-label="List view" className="h-6 px-2">
                <Rows3 className="size-3.5" />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label="Grid view" className="h-6 px-2">
                <Grid className="size-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {viewType === "list" ? (
          <TravelersTable table={table} />
        ) : (
          <TravelersGrid table={table} />
        )}
      </CardContent>
    </Card>
  );
}
