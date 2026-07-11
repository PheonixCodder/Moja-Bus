"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  Coins,
  History,
  Building,
  Landmark,
  TrendingUp,
  AlertTriangle,
  ArrowRightLeft,
  Info,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@moja/ui/components/ui/tabs";
import { Badge } from "@moja/ui/components/ui/badge";

export function AdminSettlementsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useQueryState("tab", { defaultValue: "ledger" });
  const [selectedClass, setSelectedClass] = useQueryState("class", { defaultValue: "OPERATOR_RECEIVABLE" });
  const [selectedCompanyId, setSelectedCompanyId] = useQueryState("company", { defaultValue: "" });
  const [currentPageParam, setCurrentPageParam] = useQueryState("page", parseAsInteger.withDefault(1));
  const currentPage = currentPageParam - 1; // Convert to 0-indexed for Prisma offset
  const pageSize = 20;

  // Record Settlement Dialog State
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutCompany, setPayoutCompany] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");

  // Suspense Queries
  const { data: companies } = useSuspenseQuery(
    trpc.public.listOperators.queryOptions()
  );

  const { data: treasury, refetch: refetchTreasury } = useSuspenseQuery(
    trpc.payments.getTreasuryOverview.queryOptions()
  );

  const { data: ledgerResult } = useSuspenseQuery(
    trpc.payments.listLedgerEntries.queryOptions({
      companyId: selectedClass === "OPERATOR_RECEIVABLE" && selectedCompanyId ? selectedCompanyId : undefined,
      accountClass: selectedClass,
      limit: pageSize,
      offset: currentPage * pageSize,
    })
  );

  // Query specific company ledger balance
  const { data: exportData, isLoading: isExportLoading } = useQuery(
    trpc.payments.exportOperatorLedger.queryOptions(
      { companyId: payoutCompany?.id ?? "" },
      { enabled: !!payoutCompany?.id }
    )
  );

  // Settlement mutation
  const recordSettlementMutation = useMutation(
    trpc.payments.recordSettlement.mutationOptions({
      onSuccess: () => {
        toast.success("Offline manual settlement recorded successfully");
        setIsPayoutOpen(false);
        setPayoutAmount("");
        setPayoutNote("");
        setPayoutCompany(null);
        queryClient.invalidateQueries(trpc.payments.listLedgerEntries.pathFilter());
        refetchTreasury();
        if (payoutCompany) {
          queryClient.invalidateQueries(trpc.payments.exportOperatorLedger.pathFilter());
        }
      },
      onError: (err) => {
        toast.error(err.message || "Failed to record settlement");
      },
    })
  );

  const handleRecordPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutCompany || !payoutAmount) return;

    const amount = parseInt(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payout amount");
      return;
    }

    if (exportData && amount > exportData.balanceXOF) {
      toast.error("Payout amount exceeds the available ledger balance");
      return;
    }

    recordSettlementMutation.mutate({
      companyId: payoutCompany.id,
      amountXOF: amount,
      note: payoutNote.trim() || undefined,
    });
  };

  const getLedgerTypeStyle = (type: string) => {
    switch (type) {
      case "CREDIT":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "DEBIT":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Treasury Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200 overflow-hidden relative shadow-sm">
          <div className="absolute right-0 top-0 translate-y-2 -translate-x-2 text-slate-500/5 pointer-events-none">
            <Landmark className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Landmark className="size-4 text-slate-500" />
              Moja Treasury Clearing
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Asset account representing Paystack settled balance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {treasury.clearingBalance.toLocaleString()} <span className="text-sm font-normal text-slate-500">XOF</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <ArrowRightLeft className="size-3 text-slate-400" />
              Includes all card/mobile-money bookings and top-ups
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 border-indigo-100 overflow-hidden relative shadow-sm">
          <div className="absolute right-0 top-0 translate-y-2 -translate-x-2 text-indigo-500/5 pointer-events-none">
            <TrendingUp className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <TrendingUp className="size-4 text-indigo-600" />
              Moja Platform Revenue
            </CardTitle>
            <CardDescription className="text-xs text-indigo-400">
              Revenue account representing total commissions & fees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-indigo-950 tracking-tight">
              {treasury.revenueBalance.toLocaleString()} <span className="text-sm font-normal text-slate-500">XOF</span>
            </div>
            <p className="text-[10px] text-indigo-600/80 mt-1 flex items-center gap-1">
              Convenience fees + operator trip commission portions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab ?? "ledger"} onValueChange={(val) => setActiveTab(val)} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-md border border-slate-200">
          <TabsTrigger value="ledger" className="px-4 py-2 font-semibold text-xs flex items-center gap-1.5 rounded-sm transition-all">
            <History className="size-3.5" />
            Ledger Auditor
          </TabsTrigger>
          <TabsTrigger value="payouts" className="px-4 py-2 font-semibold text-xs flex items-center gap-1.5 rounded-sm transition-all">
            <Coins className="size-3.5" />
            Offline Settlements
          </TabsTrigger>
        </TabsList>

        {/* Ledger Auditor Content */}
        <TabsContent value="ledger" className="space-y-4">
          <Card className="bg-white border-border shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                {/* Account Class Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Class:</span>
                  <select
                    className="h-9 rounded border border-border bg-white px-2 py-1 text-xs text-slate-850 outline-none w-48 font-semibold"
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedCompanyId(""); // Clear company when switching classes since company only applies to operator receivable
                      setCurrentPageParam(1);
                    }}
                  >
                    <option value="OPERATOR_RECEIVABLE">Operator Receivable</option>
                    <option value="PAYSTACK_CLEARING">System Clearing (Paystack)</option>
                    <option value="PLATFORM_FEES">Platform Fees (Revenue)</option>
                  </select>
                </div>

                {/* Company Dropdown (only visible for Operator Receivable) */}
                {selectedClass === "OPERATOR_RECEIVABLE" && (
                  <div className="flex items-center gap-2">
                    <Building className="size-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Operator:</span>
                    <select
                      className="h-9 rounded border border-border bg-white px-2 py-1 text-xs text-slate-800 outline-none w-48"
                      value={selectedCompanyId}
                      onChange={(e) => {
                        setSelectedCompanyId(e.target.value || "");
                        setCurrentPageParam(1);
                      }}
                    >
                      <option value="">All Companies</option>
                      {companies?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {selectedClass === "OPERATOR_RECEIVABLE" && selectedCompanyId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs font-semibold h-8"
                  onClick={() => {
                    const comp = companies?.find((c) => c.id === selectedCompanyId);
                    if (comp) {
                      setPayoutCompany(comp);
                      setPayoutAmount("");
                      setPayoutNote("");
                      setIsPayoutOpen(true);
                    }
                  }}
                >
                  <Coins className="size-3.5 text-emerald-600" />
                  Offline Settle Selected Operator
                </Button>
              )}
            </div>
          </Card>

          {ledgerResult && ledgerResult.items.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <History className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No Ledger Entries</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  There are no credits or debits recorded in the transaction ledger for this filter yet.
                </p>
              </div>
            </div>
          ) : ledgerResult ? (
            <div className="space-y-4">
              <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Account Label</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Type</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Source</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Amount</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Description</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerResult.items.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-slate-50/50">
                        <TableCell className="px-4 py-3 font-semibold text-slate-900">{entry.company.name}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className={getLedgerTypeStyle(entry.entryType)}>
                            {entry.entryType}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-slate-600 text-xs font-semibold">{entry.sourceType}</TableCell>
                        <TableCell className="px-4 py-3 text-slate-900 text-xs font-bold">
                          {entry.entryType === "CREDIT" ? "+" : "-"}
                          {entry.amountXOF.toLocaleString()} XOF
                        </TableCell>
                        <TableCell className="px-4 py-3 text-slate-600 text-xs truncate max-w-xs">{entry.description}</TableCell>
                        <TableCell className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(entry.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {ledgerResult.total > pageSize && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, ledgerResult.total)} of {ledgerResult.total} entries
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
                      disabled={currentPageParam * pageSize >= ledgerResult.total}
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
        </TabsContent>

        {/* Operator Payouts Tab */}
        <TabsContent value="payouts">
          {companies && companies.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Building className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No Active Operators</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  There are no verified or active operators registered on the platform.
                </p>
              </div>
            </div>
          ) : companies ? (
            <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Operator Name</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Year Established</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Active Fleet</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Active Routes</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id} className="hover:bg-slate-50/50">
                      <TableCell className="px-4 py-3 font-semibold text-slate-900">{c.name}</TableCell>
                      <TableCell className="px-4 py-3 text-slate-600 text-xs">{c.yearEstablished || "N/A"}</TableCell>
                      <TableCell className="px-4 py-3 text-slate-600 text-xs font-bold">{c._count.fleet} Buses</TableCell>
                      <TableCell className="px-4 py-3 text-slate-600 text-xs font-bold">{c._count.routes} Routes</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs font-semibold h-8"
                          onClick={() => {
                            setPayoutCompany(c);
                            setPayoutAmount("");
                            setPayoutNote("");
                            setIsPayoutOpen(true);
                          }}
                        >
                          <Coins className="size-3.5 text-emerald-600" />
                          Record Offline Settlement
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Emergency Offline Settlement Dialog */}
      <Dialog open={isPayoutOpen} onOpenChange={(open) => !open && setIsPayoutOpen(false)}>
        {payoutCompany && (
          <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-600 shrink-0" />
                Emergency Offline Settlement
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Record a manual cash or wire payout done outside of Paystack for {payoutCompany.name}. This will debit their ledger liability balance.
              </DialogDescription>
            </DialogHeader>

            {isExportLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : exportData ? (
              <form onSubmit={handleRecordPayout} className="space-y-4 py-2">
                
                {/* Emergency Alert Note */}
                <div className="rounded-lg bg-amber-50 p-3.5 border border-amber-100 text-xs text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Info className="size-3.5 text-amber-650 shrink-0" />
                    Important Notice
                  </div>
                  <p className="text-amber-700 leading-relaxed">
                    Standard payouts are self-serve initiated by operators and routed automatically via the Paystack Transfer API. 
                    Only use this form to record emergency cash handovers or direct bank transfers conducted manually.
                  </p>
                </div>

                <div className="rounded border border-slate-100 p-3 bg-slate-50 space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Operator:</span>
                    <span>{payoutCompany.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Total Transactions:</span>
                    <span>{exportData.entryCount} entries</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200 mt-1">
                    <span className="font-bold text-slate-800">Current Ledger Balance:</span>
                    <span className="font-bold text-slate-955">{exportData.balanceXOF.toLocaleString()} XOF</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Payout Amount (XOF)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      min="1"
                      max={exportData.balanceXOF}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      required
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">XOF</span>
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Manual Reference / Explanation *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Handed cash to Director at Abidjan terminal"
                    value={payoutNote}
                    onChange={(e) => setPayoutNote(e.target.value)}
                    required
                  />
                </div>

                <DialogFooter className="pt-4 gap-2 sm:gap-0">
                  <Button type="button" variant="outline" className="h-9" onClick={() => setIsPayoutOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white h-9"
                    disabled={recordSettlementMutation.isPending || exportData.balanceXOF <= 0}
                  >
                    {recordSettlementMutation.isPending ? (
                      <>
                        <Spinner className="mr-2 size-3.5 text-white" />
                        Recording...
                      </>
                    ) : (
                      "Record Manual Settlement"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ) : null}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
