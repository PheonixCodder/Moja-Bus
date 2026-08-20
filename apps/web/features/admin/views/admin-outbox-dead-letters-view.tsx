"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

import { useTranslations } from "next-intl";

export function AdminOutboxDeadLettersView() {
  const t = useTranslations("adminDashboard.outboxDeadLetters");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listQuery = useQuery(
    trpc.payments.listOutboxMessages.queryOptions({
      status: "NEEDS_ATTENTION",
      limit: 50,
      offset: 0,
    }),
  );

  const invalidate = () =>
    queryClient.invalidateQueries(trpc.payments.listOutboxMessages.pathFilter());

  const retryMutation = useMutation(
    trpc.payments.retryOutboxMessage.mutationOptions({
      onSuccess: async (res) => {
        if (res.ok) toast.success("Re-queued for delivery");
        else toast.error("Could not retry (already sent or missing)");
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
          {t("title")}
        </h1>
        <p className="text-sm text-slate-500">
          {t("description")}
        </p>
      </div>
      <Card className="divide-y overflow-hidden">
        {listQuery.isLoading ? (
          <p className="p-4 text-sm text-slate-500">{t("loading")}</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {t("empty")}
          </p>
        ) : (
          items.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-0.5 text-sm min-w-0">
                <p className="font-medium text-slate-900">
                  {m.type} · {m.status}
                </p>
                <p className="text-xs text-slate-500 font-mono truncate">
                  {m.idempotencyKey}
                </p>
                <p className="text-xs text-slate-400">
                  {t("attempts")} {m.attempts}/{m.maxAttempts} ·{" "}
                  {new Date(m.updatedAt).toLocaleString()}
                </p>
                {m.lastError ? (
                  <p className="text-xs text-red-600 break-words">{m.lastError}</p>
                ) : null}
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={retryMutation.isPending}
                onClick={() => retryMutation.mutate({ id: m.id })}
              >
                {t("retry")}
              </Button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
