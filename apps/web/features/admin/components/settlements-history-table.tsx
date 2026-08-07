"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  History,
  User,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";
import { useTRPC } from "@/trpc/client";

function formatXOF(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const PAGE_SIZE = 20;

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("adminDashboard.settlementsHistoryTable");
  switch (status) {
    case "SETTLED":
      return (
        <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
          <CheckCircle2 className="size-3" />
          {t("settled")}
        </Badge>
      );
    case "FAILED":
    case "REVERSED":
      return (
        <Badge className="gap-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
          <XCircle className="size-3" />
          {status === "REVERSED" ? t("reversed") : t("failed")}
        </Badge>
      );
    default:
      return (
        <Badge className="gap-1 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
          <Clock className="size-3" />
          {t("pending")}
        </Badge>
      );
  }
}

export function SettlementsHistoryTable() {
  const t = useTranslations("adminDashboard.settlementsHistoryTable");
  const trpc = useTRPC();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const offset = (page - 1) * PAGE_SIZE;

  const { data } = useSuspenseQuery(
    trpc.payments.listSettlementHistory.queryOptions({
      limit: PAGE_SIZE,
      offset,
    }),
  );

  const { items, total } = data;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10">
              <History className="size-4.5 text-sidebar-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                {t("settlementHistory")}
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("totalSettlements", { count: total })}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {t("noSettlementsYet")}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {t("noSettlementsDescription")}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="px-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("date")}
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("operator")}
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("amount")}
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("referenceNote")}
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("triggeredBy")}
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("status")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-border transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="px-6 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(item.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(item.createdAt), "HH:mm")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10">
                          <span className="text-[10px] font-bold text-sidebar-primary">
                            {item.operatorName.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {item.operatorName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {formatXOF(item.amountXOF)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 max-w-[240px]">
                      <p
                        className="truncate text-xs text-muted-foreground"
                        title={item.note ?? ""}
                      >
                        {item.note || (
                          <span className="italic text-muted-foreground/60">
                            {t("noNote")}
                          </span>
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="py-3.5">
                      {item.metadata?.settledByUserId ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="size-3 shrink-0" />
                          <span className="truncate max-w-[120px] font-mono text-[10px]">
                            {item.metadata.settledByUserId.slice(0, 8)}…
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          {t("none")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <StatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <p className="text-xs text-muted-foreground">
                  {t("showing", {
                    from: offset + 1,
                    to: Math.min(offset + PAGE_SIZE, total),
                    total,
                  })}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    id="settlements-history-prev"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-border"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <span className="px-2 text-xs text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    id="settlements-history-next"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-border"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
