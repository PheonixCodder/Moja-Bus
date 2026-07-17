"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  Activity,
  Building,
  Clock,
  Users,
} from "lucide-react";
import { Card } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Badge } from "@moja/ui/components/ui/badge";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";
import { formatAdminDateTime } from "@/lib/format-date";

export function AdminOperationsView() {
  const trpc = useTRPC();
  const [selectedCompanyId, setSelectedCompanyId] = useQueryState("company", { defaultValue: "" });
  const [currentPageParam, setCurrentPageParam] = useQueryState("page", parseAsInteger.withDefault(1));
  const currentPage = currentPageParam - 1; // 0-indexed internally
  const pageSize = 20;

  // Suspense Queries
  const { data: companies } = useSuspenseQuery(
    trpc.public.listOperators.queryOptions()
  );

  const { data: operations } = useSuspenseQuery(
    trpc.admin.listOperations.queryOptions({
      companyId: selectedCompanyId || undefined,
      limit: pageSize,
      offset: currentPage * pageSize,
    })
  );

  const getTripStatusStyle = (status: string) => {
    switch (status) {
      case "BOARDING":
        return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
      case "DEPARTED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ARRIVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building className="size-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Operator:</span>
            <Combobox
              items={[
                { label: "All Companies", value: "ALL" },
                ...(companies?.map((c: any) => ({ label: c.name, value: c.id })) ?? []),
              ]}
              value={selectedCompanyId || "ALL"}
              onValueChange={(val) => {
                setSelectedCompanyId(val === "ALL" ? "" : (val ?? ""));
                setCurrentPageParam(1);
              }}
            >
              <ComboboxInput
                placeholder="Filter by operator..."
                className="w-full sm:w-56 h-9 bg-white"
              />
              <ComboboxContent>
                <ComboboxEmpty>No operator found.</ComboboxEmpty>
                <ComboboxList>
                  <ComboboxItem value="ALL">All Companies</ComboboxItem>
                  {companies?.map((c: any) => (
                    <ComboboxItem key={c.id} value={c.id}>{c.name}</ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </Card>

      {/* Trips Table */}
      {operations && operations.items.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <Activity className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No Trips Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              There are no trips matching the selected filters.
            </p>
          </div>
        </div>
      ) : operations ? (
        <div className="space-y-4">
          <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Operator</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Route</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Departure</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Occupancy</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Status</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Delay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.items.map((trip) => (
                  <TableRow key={trip.id} className="hover:bg-slate-50/50">
                    <TableCell className="px-4 py-3 font-semibold text-slate-900">{trip.companyName}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        {trip.routeLabel}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-600 text-xs">
                      {formatAdminDateTime(trip.departureDate)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-700 font-bold text-xs">
                      <div className="flex items-center gap-1">
                        <Users className="size-3.5 text-slate-400" />
                        <span>{trip.occupantCount} Booked</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={getTripStatusStyle(trip.status)}>
                        {trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-500 text-xs font-mono">
                      {trip.delayMinutes > 0 ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <Clock className="size-3 shrink-0" />
                          +{trip.delayMinutes} mins
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {operations.total > pageSize && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">
                Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, operations.total)} of {operations.total} trips
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPageParam === 1}
                  onClick={() => setCurrentPageParam((p) => p - 1)}
                  className="h-8 text-xs font-semibold"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPageParam * pageSize >= operations.total}
                  onClick={() => setCurrentPageParam((p) => p + 1)}
                  className="h-8 text-xs font-semibold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
