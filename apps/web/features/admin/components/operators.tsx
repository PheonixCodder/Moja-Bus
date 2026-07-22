"use client";

import * as React from "react";
import {
  type ColumnFiltersState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, LayoutGrid, List, Search } from "lucide-react";

import { Button } from "@moja/ui/components/ui/button";
import { Card, CardContent, CardHeader } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@moja/ui/components/ui/tabs";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

import { columns, type OperatorRow } from "./operators-columns";
import { OperatorsTable } from "./operators-table";
import { OperatorsGrid } from "./operators-grid";
import { useQueryStates } from "nuqs";
import { operatorSearchParams } from "../lib/search-params";

export function Operators() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [params, setParams] = useQueryStates(operatorSearchParams);
  const viewMode = params.view;

  const columnFilters = React.useMemo(() => {
    const filters: ColumnFiltersState = [];
    if (params.search) filters.push({ id: "search", value: params.search });
    if (params.status && params.status !== "All") filters.push({ id: "status", value: params.status });
    return filters;
  }, [params.search, params.status]);

  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.admin.listUsers.queryOptions({ role: "OPERATOR", limit: 100, offset: 0 }));

  const tableData = React.useMemo(() => {
    return (data?.items || []).map((user) => {
      let status = "Active";
      if (!user.emailVerified) status = "Pending";
      // Determine companies
      const companies = user.operatorProfiles?.map(op => op.company.name) || [];

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phoneNumber || "Not provided",
        role: user.role,
        status,
        companies,
        joinedAt: user.createdAt,
        avatar: user.image || "",
      } as OperatorRow;
    });
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <Card className="border-none shadow-sm bg-background">
      <CardHeader className="p-0 pb-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 pt-4">
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-lg">All Operators</h3>
            <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-medium">
              {tableData.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setParams({ view: v as "list" | "grid" })} className="h-9">
              <TabsList className="h-9 p-1">
                <TabsTrigger value="list" className="h-7 px-3 flex gap-2">
                  <List className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only text-xs">List</span>
                </TabsTrigger>
                <TabsTrigger value="grid" className="h-7 px-3 flex gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only text-xs">Grid</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" className="h-9 hidden sm:flex">
              <Download className="mr-2 h-4 w-4" />
              Export
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search operators..."
              className="pl-8 h-9"
              value={params.search}
              onChange={(event) => {
                setParams({ search: event.target.value || "" });
                table.setPageIndex(0);
              }}
            />
          </div>
        </div>

        <div className="w-full">
          {viewMode === "list" ? (
            <OperatorsTable table={table} />
          ) : (
            <div className="px-4 pb-4">
              <OperatorsGrid table={table} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
