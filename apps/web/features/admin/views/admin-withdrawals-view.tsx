"use client";

import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { useTRPC } from "@/trpc/client";
import { WithdrawalsKpiCards } from "../components/withdrawals-kpi-cards";
import { WithdrawalsFilterBar } from "../components/withdrawals-filter-bar";
import { WithdrawalsTable } from "../components/withdrawals-table";
import { WithdrawalsPagination } from "../components/withdrawals-pagination";
import { WithdrawalsResolveDialog } from "../components/withdrawals-resolve-dialog";
import type { WithdrawalRow } from "../components/withdrawals-columns";
import { withdrawalsSearchParams } from "../lib/search-params";

const PAGE_SIZE = 15;

export function AdminWithdrawalsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [{ status, page, from, to }] = useQueryStates(
    withdrawalsSearchParams,
    { shallow: false }
  );

  const [resolveRow, setResolveRow] = useState<WithdrawalRow | null>(null);

  const { data: withdrawals } = useSuspenseQuery(
    trpc.admin.listAllWithdrawals.queryOptions({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      status: status === "ALL" ? undefined : status,
      from: from || undefined,
      to: to || undefined,
    })
  );

  const handleResolved = () => {
    setResolveRow(null);
    queryClient.invalidateQueries(trpc.admin.listAllWithdrawals.pathFilter());
    queryClient.invalidateQueries(trpc.admin.getWithdrawalStats.pathFilter());
  };

  return (
    <div className="space-y-6">
      <WithdrawalsKpiCards />
      <WithdrawalsFilterBar total={withdrawals.total} />
      <WithdrawalsTable onResolve={setResolveRow} pageSize={PAGE_SIZE} />
      <WithdrawalsPagination total={withdrawals.total} pageSize={PAGE_SIZE} />
      <WithdrawalsResolveDialog
        row={resolveRow}
        open={!!resolveRow}
        onOpenChange={(open) => !open && setResolveRow(null)}
        onSuccess={handleResolved}
      />
    </div>
  );
}
