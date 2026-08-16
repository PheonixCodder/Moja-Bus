"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { formatPriceXOF } from "@/features/search/lib/format";

export function AdminOfflineRefundsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listQuery = useQuery(
    trpc.payments.listOfflineRefundsOwed.queryOptions({ limit: 50, offset: 0 }),
  );

  const invalidate = () =>
    queryClient.invalidateQueries(
      trpc.payments.listOfflineRefundsOwed.pathFilter(),
    );

  const paidMutation = useMutation(
    trpc.payments.markOfflineRefundPaid.mutationOptions({
      onSuccess: async () => {
        toast.success("Marked as paid");
        await invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const voidMutation = useMutation(
    trpc.payments.markOfflineRefundVoid.mutationOptions({
      onSuccess: async () => {
        toast.success("Voided obligation");
        await invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const items = listQuery.data?.items ?? [];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Offline refunds owed
        </h1>
        <p className="text-sm text-slate-500">
          Cash and voucher cancellations awaiting fulfilment (PENDING_FULFILMENT).
        </p>
      </div>
      <Card className="divide-y overflow-hidden">
        {listQuery.isLoading ? (
          <p className="p-4 text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No outstanding offline refunds.</p>
        ) : (
          items.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-0.5 text-sm">
                <p className="font-medium text-slate-900">
                  {formatPriceXOF(r.amountXOF)} · {r.channel}
                </p>
                <p className="text-slate-600">
                  {r.booking?.bookingReference ?? "—"} ·{" "}
                  {r.booking?.passengerName ?? "Passenger"}
                </p>
                <p className="text-xs text-slate-400">
                  {r.reason ?? "Cancellation"} ·{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={paidMutation.isPending || voidMutation.isPending}
                  onClick={() => paidMutation.mutate({ refundId: r.id })}
                >
                  Mark paid
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={paidMutation.isPending || voidMutation.isPending}
                  onClick={() =>
                    voidMutation.mutate({
                      refundId: r.id,
                      note: "Voided by admin",
                    })
                  }
                >
                  Void
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
