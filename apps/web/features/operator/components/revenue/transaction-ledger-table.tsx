"use client";

import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { revenueParsers } from "../../lib/revenue-search-params";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { format } from "date-fns";
import { formatXOF } from "../../lib/currency";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  Download,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function TransactionLedgerTable() {
  const t = useTranslations("operatorDashboard.revenue");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [{ from, to, page, txType }, setParams] = useQueryStates(
    revenueParsers,
    {
      shallow: false,
    },
  );

  const { data } = useSuspenseQuery(
    trpc.operator.getLedgerEntries.queryOptions({
      from: from.toISOString(),
      to: to.toISOString(),
      type: txType,
      page,
      limit: 10,
    }),
  );

  const formatSourceType = (type: string) => {
    switch (type) {
      case "BOOKING":
      case "WALLET_BOOKING":
        return t("ledger.sourceType.ticketSale");
      case "OPERATOR_PAYOUT":
        return t("ledger.sourceType.withdrawal");
      case "REFUND":
      case "WALLET_REFUND":
        return t("ledger.sourceType.ticketRefund");
      case "MANUAL_ADJUSTMENT":
        return t("ledger.sourceType.adjustment");
      default:
        return type;
    }
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">
          {t("ledger.title")}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={async () => {
              try {
                const result = await queryClient.fetchQuery(
                  trpc.operator.exportLedgerCsv.queryOptions({
                    from: from.toISOString(),
                    to: to.toISOString(),
                  }),
                );
                const blob = new Blob([result.csv], {
                  type: "text/csv;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "ledger-export.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success(
                  t("ledger.exportSuccess", { count: result.count }),
                );
              } catch (err: unknown) {
                toast.error(
                  err instanceof Error ? err.message : t("ledger.exportError"),
                );
              }
            }}
          >
            <Download className="size-3.5" />
            {t("export")}
          </Button>
          <Select
            value={txType}
            onValueChange={(val) => setParams({ txType: val, page: 1 })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("ledger.filter.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("ledger.filter.all")}</SelectItem>
              <SelectItem value="TICKET_SALE">
                {t("ledger.filter.ticketSales")}
              </SelectItem>
              <SelectItem value="WITHDRAWAL">
                {t("ledger.filter.withdrawals")}
              </SelectItem>
              <SelectItem value="REFUND">
                {t("ledger.filter.refunds")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead>{t("ledger.columns.date")}</TableHead>
            <TableHead>{t("ledger.columns.type")}</TableHead>
            <TableHead>{t("ledger.columns.description")}</TableHead>
            <TableHead>{t("ledger.columns.status")}</TableHead>
            <TableHead className="text-right">
              {t("ledger.columns.amount")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.entries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-32 text-center text-slate-500"
              >
                {t("ledger.empty")}
              </TableCell>
            </TableRow>
          ) : (
            data.entries.map((entry) => (
              <TableRow key={entry.id} className="hover:bg-slate-50/50">
                <TableCell className="text-slate-600">
                  {format(new Date(entry.createdAt), "dd MMM yyyy, HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-900">
                    {formatSourceType(entry.sourceType)}
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 truncate max-w-[300px]">
                  {entry.description || "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.status === "POSTED" || entry.status === "SETTLED"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className={`flex items-center justify-end font-medium ${
                      entry.entryType === "CREDIT"
                        ? "text-emerald-600"
                        : "text-slate-900"
                    }`}
                  >
                    {entry.entryType === "CREDIT" ? (
                      <ArrowDownRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    )}
                    {formatXOF(entry.amountXOF)}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination controls */}
      <div className="p-4 border-t flex items-center justify-between bg-slate-50/50 text-sm">
        <div className="text-slate-500">
          {t("ledger.pagination", {
            page: data.meta.page,
            totalPages: data.meta.totalPages || 1,
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParams({ page: Math.max(1, page - 1) })}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setParams({ page: Math.min(data.meta.totalPages, page + 1) })
            }
            disabled={page >= data.meta.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
