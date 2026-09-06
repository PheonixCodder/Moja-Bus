"use client";

import { useTranslations, useLocale } from "next-intl";
import { History, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";

interface LedgerEntryDTO {
  id: string;
  amount: number;
  description: string | null;
  createdAt: Date;
}

interface TransactionHistoryProps {
  ledgerResult:
    | {
        items: LedgerEntryDTO[];
        total: number;
      }
    | undefined;
  pageSize: number;
  currentPageParam: number;
  setCurrentPageParam: (page: number | ((prev: number) => number)) => void;
}

export function TransactionHistory({
  ledgerResult,
  pageSize,
  currentPageParam,
  setCurrentPageParam,
}: TransactionHistoryProps) {
  const t = useTranslations("passengerDashboard.wallet");
  const locale = useLocale();
  const currentPage = currentPageParam - 1;

  return (
    <Card className="border-border bg-surface overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-b border-border bg-muted">
        <div>
          <CardTitle className="text-base font-extrabold text-foreground tracking-tight font-display">
            {t("history")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("historyDesc")}
          </CardDescription>
        </div>
        <History className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0">
        {ledgerResult && ledgerResult.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground space-y-3">
            <div className="w-12 h-12 bg-card-elevated rounded-full flex items-center justify-center text-muted-foreground">
              <History className="w-6 h-6" />
            </div>
            <p className="font-medium">{t("noTransactions")}</p>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              {t("noTransactionsDesc")}
            </p>
          </div>
        ) : ledgerResult ? (
          <div className="space-y-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider h-11 px-6">
                      {t("colTransaction")}
                    </TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider h-11 px-6">
                      {t("colAmount")}
                    </TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider h-11 px-6">
                      {t("colMethod")}
                    </TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider h-11 px-6">
                      {t("colDate")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerResult.items.map((entry) => {
                    const desc = entry.description ?? "";
                    const isCredit =
                      desc.toLowerCase().includes("credit") ||
                      desc.toLowerCase().includes("top up") ||
                      desc.toLowerCase().includes("refund");
                    return (
                      <TableRow
                        key={entry.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                                isCredit
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft className="size-4" />
                              ) : (
                                <ArrowUpRight className="size-4" />
                              )}
                            </div>
                            <span className="font-bold text-xs text-foreground truncate max-w-[200px]">
                              {desc}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs font-black">
                          <span
                            className={
                              isCredit
                                ? "text-success"
                                : "text-foreground"
                            }
                          >
                            {isCredit ? "+" : "-"}
                            {entry.amount.toLocaleString()} XOF
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 py-0.5 bg-muted rounded-md border border-border">
                            {isCredit ? "Paystack" : t("methodWallet")}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-muted-foreground text-xs font-medium">
                          {new Date(entry.createdAt).toLocaleDateString(
                            locale,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {ledgerResult.total > pageSize && (
              <div className="flex justify-between items-center text-xs p-5 border-t border-border bg-muted/50">
                <span className="text-muted-foreground font-medium">
                  {t("showingEntries", {
                    start: currentPage * pageSize + 1,
                    end: Math.min(
                      (currentPage + 1) * pageSize,
                      ledgerResult.total,
                    ),
                    total: ledgerResult.total,
                  })}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPageParam === 1}
                    onClick={() => setCurrentPageParam((p) => p - 1)}
                    className="h-8 text-xs font-semibold rounded-lg border-border"
                  >
                    {t("previous")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPageParam * pageSize >= ledgerResult.total}
                    onClick={() =>
                      setCurrentPageParam((p) => (p as number) + 1)
                    }
                    className="h-8 text-xs font-semibold rounded-lg border-border"
                  >
                    {t("next")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
