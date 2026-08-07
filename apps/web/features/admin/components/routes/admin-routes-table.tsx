"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Map } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { UrbanBadge } from "@/components/urban-badge";
import { useTRPC } from "@/trpc/client";
import { adminRoutesSearchParams } from "../../lib/search-params";

interface AdminRoutesTableProps {
  onViewRoute: (id: string) => void;
}

export function AdminRoutesTable({ onViewRoute }: AdminRoutesTableProps) {
  const t = useTranslations("adminDashboard.adminRoutesTable");
  const trpc = useTRPC();
  const [{ q, status, page, pageSize }] = useQueryStates(
    adminRoutesSearchParams,
  );

  const { data } = useSuspenseQuery(
    trpc.admin.listRoutes.queryOptions({ search: q, status, page, pageSize }),
  );

  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-card">
        <Empty>
          <EmptyTitle>{t("noRoutes")}</EmptyTitle>
          <EmptyDescription>{t("tryAdjustingSearch")}</EmptyDescription>
        </Empty>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("routeName")}</TableHead>
            <TableHead>{t("operator")}</TableHead>
            <TableHead>{t("path")}</TableHead>
            <TableHead>{t("distance")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((route) => (
            <TableRow key={route.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span>{route.name}</span>
                  {route.serviceType === "URBAN" && <UrbanBadge />}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {(route._count?.waypoints ?? 0) + 2} {t("stops")}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="size-6 border border-border">
                    <AvatarImage src={route.company.logoUrl ?? undefined} />
                    <AvatarFallback className="text-[9px]">
                      {route.company.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{route.company.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm truncate max-w-[120px]">
                    {route.originTerminal.cityRelation?.name ??
                      route.originTerminal.city}
                  </span>
                  <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[120px]">
                    {route.destTerminal.cityRelation?.name ??
                      route.destTerminal.city}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {route.distanceKm ? `${route.distanceKm} km` : "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={route.status === "ACTIVE" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {route.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-xs h-8"
                  onClick={() => onViewRoute(route.id)}
                >
                  <Map className="size-3.5" />
                  {t("viewMap")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
