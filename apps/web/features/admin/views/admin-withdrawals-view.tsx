"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  Coins,
  History,
  Building,
  Landmark,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
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
import { Badge } from "@moja/ui/components/ui/badge";

export function AdminWithdrawalsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useQueryState("status", { defaultValue: "ALL" });
  const [currentPageParam, setCurrentPageParam] = useQueryState("page", parseAsInteger.withDefault(1));
  const currentPage = currentPageParam - 1; // 0-indexed for database
  const pageSize = 15;

  // Resolve Dialog State
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [actionType, setActionType] = useState<"FORCE_COMPLETE" | "FORCE_FAIL">("FORCE_COMPLETE");
  const [reason, setReason] = useState("");

  // Query all withdrawals
  const { data: withdrawals, refetch } = useSuspenseQuery(
    trpc.admin.listAllWithdrawals.queryOptions({
      limit: pageSize,
      offset: currentPage * pageSize,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    })
  );

  // Mutation to resolve withdrawal
  const resolveMutation = useMutation(
    trpc.admin.resolveWithdrawal.mutationOptions({
      onSuccess: () => {
        toast.success("Withdrawal resolved successfully");
        setIsResolveOpen(false);
        setReason("");
        setSelectedTx(null);
        refetch();
        queryClient.invalidateQueries(trpc.payments.getTreasuryOverview.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to resolve withdrawal");
      },
    })
  );

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    resolveMutation.mutate({
      transactionId: selectedTx.id,
      action: actionType,
      reason: reason.trim(),
    });
  };

  // Compute local KPI stats
  // Let's summarize the withdrawals based on what we have (we can fetch totals, or compute from loaded list or fetch a simple stats query.
  // For the UX, let's show simple counts computed from list metadata or render clean summary metrics).
  const kpis = {
    pendingCount: withdrawals.items.filter(i => i.status === "POSTED" || i.status === "CREATED").length,
    pendingVolume: withdrawals.items
      .filter(i => i.status === "POSTED" || i.status === "CREATED")
      .reduce((sum, i) => sum + i.amount, 0),
    settledVolume: withdrawals.items
      .filter(i => i.status === "SETTLED")
      .reduce((sum, i) => sum + i.amount, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SETTLED":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="size-3 mr-1 shrink-0" />
            Settled
          </Badge>
        );
      case "FAILED":
      case "REVERSED":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="size-3 mr-1 shrink-0" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="size-3 mr-1 shrink-0" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="size-4 text-amber-500" />
              Pending Requests (This Page)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpis.pendingCount} <span className="text-xs font-normal text-slate-500">requests</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Vol: {kpis.pendingVolume.toLocaleString()} XOF
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Settled Volume (Page)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpis.settledVolume.toLocaleString()} <span className="text-xs font-normal text-slate-500">XOF</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Successfully paid out to operators
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="bg-white border-border shadow-sm p-4 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status:</span>
            <select
              className="h-8 rounded border border-border bg-white px-2 py-1 text-xs text-slate-800 outline-none w-36 font-semibold"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPageParam(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="POSTED">Pending (Posted)</option>
              <option value="SETTLED">Settled</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <span className="text-xs text-slate-400 font-semibold font-mono">
            Queue Size: {withdrawals.total} entries
          </span>
        </div>

        {/* Withdrawal Table */}
        {withdrawals.items.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
              <Landmark className="size-6" />
            </div>
            <p className="text-xs text-slate-500">No withdrawal requests found for this status.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-border rounded-md overflow-hidden bg-white shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Operator</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Paystack / Tx ID</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4 text-right">Amount</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Date</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.items.map((tx) => {
                    const metadata = (tx.metadata as any) || {};
                    const isPending = tx.status === "POSTED" || tx.status === "CREATED";
                    return (
                      <TableRow key={tx.id} className="hover:bg-slate-50/50">
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building className="size-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-900 text-xs">{tx.companyName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="space-y-0.5">
                            <div className="text-xs text-slate-700 font-medium font-mono">
                              {tx.externalPaymentId || "N/A"}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              ID: {tx.id.slice(-8).toUpperCase()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">{getStatusBadge(tx.status)}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                          {tx.amount.toLocaleString()} XOF
                        </TableCell>
                        <TableCell className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(tx.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          {isPending ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-semibold hover:bg-slate-50"
                              onClick={() => {
                                setSelectedTx(tx);
                                setActionType("FORCE_COMPLETE");
                                setReason("");
                                setIsResolveOpen(true);
                              }}
                            >
                              Resolve
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              Locked
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {withdrawals.total > pageSize && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">
                  Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, withdrawals.total)} of {withdrawals.total} entries
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
                    disabled={currentPageParam * pageSize >= withdrawals.total}
                    onClick={() => setCurrentPageParam((p) => p + 1)}
                    className="h-8 text-xs font-semibold"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={isResolveOpen} onOpenChange={(open) => !open && setIsResolveOpen(false)}>
        {selectedTx && (
          <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500 shrink-0" />
                Resolve Withdrawal Request
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Update status manually for the payout request of {selectedTx.amount.toLocaleString()} XOF from {selectedTx.companyName}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleResolveSubmit} className="space-y-4 py-2">
              {/* Action Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Manually Force Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={actionType === "FORCE_COMPLETE" ? "default" : "outline"}
                    onClick={() => setActionType("FORCE_COMPLETE")}
                    className="h-9 font-semibold text-xs text-center"
                  >
                    Force Settle (Paid)
                  </Button>
                  <Button
                    type="button"
                    variant={actionType === "FORCE_FAIL" ? "default" : "outline"}
                    onClick={() => setActionType("FORCE_FAIL")}
                    className="h-9 font-semibold text-xs text-center"
                  >
                    Force Fail (Reverse)
                  </Button>
                </div>
              </div>

              {/* Warnings */}
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-100 text-xs text-amber-800 flex gap-2.5">
                <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  {actionType === "FORCE_COMPLETE" ? (
                    <p className="leading-relaxed">
                      <strong>Force Settle</strong>: Marks the status as settled. Use this if the funds left Paystack successfully but the webhook was missed or failed to fire.
                    </p>
                  ) : (
                    <p className="leading-relaxed">
                      <strong>Force Fail</strong>: Commits a ledger reversal (`PAYOUT_REVERSAL`) to credit the operator receivable balance back, and marks the status as failed. Use if the payout failed/was reversed by the bank.
                    </p>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Resolution Reason / Ticket ID *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Bank transfer succeeded, reference #2910"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button type="button" variant="outline" className="h-9" onClick={() => setIsResolveOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white h-9"
                  disabled={resolveMutation.isPending}
                >
                  {resolveMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 size-3.5 text-white" />
                      Resolving...
                    </>
                  ) : (
                    "Apply Resolution"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
