"use client";

import { History, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
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
  ledgerResult: {
    items: LedgerEntryDTO[];
    total: number;
  } | undefined;
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
  const currentPage = currentPageParam - 1; // 0-indexed offset

  return (
    <Card className="border-border bg-bg-surface overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-b border-border bg-bg-base">
        <div>
          <CardTitle className="text-base font-extrabold text-text-primary tracking-tight font-display">
            Transaction History
          </CardTitle>
          <CardDescription className="text-xs">
            Prepaid deposits, refunds, and ticket bookings.
          </CardDescription>
        </div>
        <History className="w-4 h-4 text-text-muted" />
      </CardHeader>
      <CardContent className="p-0">
        {ledgerResult && ledgerResult.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-text-secondary space-y-3">
            <div className="w-12 h-12 bg-bg-elevated rounded-full flex items-center justify-center text-text-muted">
              <History className="w-6 h-6" />
            </div>
            <p className="font-medium">No transactions found.</p>
            <p className="text-xs text-text-muted max-w-[280px]">Your wallet deposits and ticket receipts will appear here.</p>
          </div>
        ) : ledgerResult ? (
          <div className="space-y-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-bg-base">
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-text-muted uppercase tracking-wider h-11 px-6">Transaction</TableHead>
                    <TableHead className="text-[10px] font-bold text-text-muted uppercase tracking-wider h-11 px-6">Amount</TableHead>
                    <TableHead className="text-[10px] font-bold text-text-muted uppercase tracking-wider h-11 px-6">Method/Detail</TableHead>
                    <TableHead className="text-[10px] font-bold text-text-muted uppercase tracking-wider h-11 px-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerResult.items.map((entry) => {
                    const desc = entry.description ?? "";
                    const isCredit = desc.toLowerCase().includes("credit") || desc.toLowerCase().includes("top up") || desc.toLowerCase().includes("refund");
                    return (
                      <TableRow key={entry.id} className="border-b border-border/50 hover:bg-bg-base/30 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                              isCredit 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-red-50 text-[#ee237c] border-red-100"
                            }`}>
                              {isCredit ? (
                                <ArrowDownLeft className="size-4" />
                              ) : (
                                <ArrowUpRight className="size-4" />
                              )}
                            </div>
                            <span className="font-bold text-xs text-text-primary truncate max-w-[200px]">
                              {desc}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs font-black">
                          <span className={isCredit ? "text-emerald-600" : "text-text-primary"}>
                            {isCredit ? "+" : "-"}
                            {entry.amount.toLocaleString()} XOF
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted px-2 py-0.5 bg-bg-base rounded-md border border-border">
                            {isCredit ? "Paystack" : "Wallet"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-text-secondary text-xs font-medium">
                          {new Date(entry.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {ledgerResult.total > pageSize && (
              <div className="flex justify-between items-center text-xs p-5 border-t border-border bg-bg-base/50">
                <span className="text-text-secondary font-medium">
                  Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, ledgerResult.total)} of {ledgerResult.total} entries
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPageParam === 1}
                    onClick={() => setCurrentPageParam((p) => p - 1)}
                    className="h-8 text-xs font-semibold rounded-lg border-border"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPageParam * pageSize >= ledgerResult.total}
                    onClick={() => setCurrentPageParam((p) => (p as number) + 1)}
                    className="h-8 text-xs font-semibold rounded-lg border-border"
                  >
                    Next
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
