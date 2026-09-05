"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, Building, Clock, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";
import { useState } from "react";
import { formatAdminDateTime } from "@/lib/format-date";
import { useTRPC } from "@/trpc/client";

export function AdminOperationsView() {
  const t = useTranslations("adminDashboard.adminOperationsView");
  const trpc = useTRPC();
  const [selectedCompanyId, setSelectedCompanyId] = useQueryState("company", {
    defaultValue: "",
  });
  const [currentPageParam, setCurrentPageParam] = useQueryState(
    "page",
    parseAsInteger.withDefault(1),
  );
  const currentPage = currentPageParam - 1; // 0-indexed internally
  const pageSize = 20;

  // Suspense Queries
  const { data: companies } = useSuspenseQuery(
    trpc.public.listOperators.queryOptions(),
  );

  const { data: operations } = useSuspenseQuery(
    trpc.admin.listOperations.queryOptions({
      companyId: selectedCompanyId || undefined,
      limit: pageSize,
      offset: currentPage * pageSize,
    }),
  );

  const getTripStatusStyle = (status: string) => {
    switch (status) {
      case "BOARDING":
        return "bg-warning/15 text-warning border-warning/30 animate-pulse";
      case "DEPARTED":
        return "bg-primary/15 text-primary border-primary/30";
      case "ARRIVED":
        return "bg-success/15 text-success border-success/30";
      case "CANCELLED":
        return "bg-destructive/15 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building className="size-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t("operator")}
            </span>
            <Combobox
              items={[
                { label: t("allCompanies"), value: "ALL" },
                ...(companies?.map((c: any) => ({
                  label: c.name,
                  value: c.id,
                })) ?? []),
              ]}
              value={selectedCompanyId || "ALL"}
              onValueChange={(val) => {
                setSelectedCompanyId(val === "ALL" ? "" : (val ?? ""));
                setCurrentPageParam(1);
              }}
            >
              <ComboboxInput
                placeholder={t("filterByOperator")}
                className="w-full sm:w-56 h-9 bg-card"
              />
              <ComboboxContent>
                <ComboboxEmpty>{t("noTripsMatchFilters")}</ComboboxEmpty>
                <ComboboxList>
                  <ComboboxItem value="ALL">{t("allCompanies")}</ComboboxItem>
                  {companies?.map((c: any) => (
                    <ComboboxItem key={c.id} value={c.id}>
                      {c.name}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </Card>

      {/* Trips Table */}
      {operations && operations.items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground mx-auto">
            <Activity className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              {t("noTripsFound")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {t("noTripsMatchFilters")}
            </p>
          </div>
        </div>
      ) : operations ? (
        <div className="space-y-4">
          <div className="border border-border rounded-md bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                    {t("operator")}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                    {t("route")}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                    {t("departure")}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                    {t("occupancy")}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                    {t("status")}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                    {t("delay")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.items.map((trip) => (
                  <TableRow key={trip.id} className="hover:bg-muted/50">
                    <TableCell className="px-4 py-3 font-semibold text-foreground">
                      {trip.companyName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        {trip.routeLabel}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                      {formatAdminDateTime(trip.departureDate)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-foreground font-bold text-xs">
                      <div className="flex items-center gap-1">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span>
                          {trip.occupantCount} {t("booked")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={getTripStatusStyle(trip.status)}>
                        {trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground text-xs font-mono">
                      {trip.delayMinutes > 0 ? (
                        <span className="text-destructive font-bold flex items-center gap-1">
                          <Clock className="size-3 shrink-0" />+
                          {trip.delayMinutes} {t("mins")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-medium">
                          {t("none")}
                        </span>
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
              <span className="text-muted-foreground font-medium">
                {t("showing", {
                  start: currentPage * pageSize + 1,
                  end: Math.min((currentPage + 1) * pageSize, operations.total),
                  total: operations.total,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPageParam === 1}
                  onClick={() => setCurrentPageParam((p) => p - 1)}
                  className="h-8 text-xs font-semibold"
                >
                  {t("previous")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPageParam * pageSize >= operations.total}
                  onClick={() => setCurrentPageParam((p) => p + 1)}
                  className="h-8 text-xs font-semibold"
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
