"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

import { useTranslations } from "next-intl";

export function AdminPromoCreditsCard() {
  const t = useTranslations("adminDashboard.promoCredits");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [amountXOF, setAmountXOF] = useState("1000");
  const [lookupUserId, setLookupUserId] = useState<string | null>(null);

  const grantMutation = useMutation(
    trpc.discountsAdmin.grantCredit.mutationOptions({
      onSuccess: async () => {
        toast.success(t("toastGranted"));
        if (lookupUserId) {
          await queryClient.invalidateQueries(
            trpc.discountsAdmin.listUserCredits.queryFilter({
              userId: lookupUserId,
            }),
          );
        }
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const lotsQuery = useQuery({
    ...trpc.discountsAdmin.listUserCredits.queryOptions({
      userId: lookupUserId ?? "",
      limit: 20,
    }),
    enabled: Boolean(lookupUserId),
  });

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{t("title")}</h2>
        <p className="text-xs text-slate-500">{t("description")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="credit-user">{t("userIdLabel")}</Label>
          <Input
            id="credit-user"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="cuid…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="credit-amount">{t("amountLabel")}</Label>
          <Input
            id="credit-amount"
            type="number"
            min={1}
            value={amountXOF}
            onChange={(e) => setAmountXOF(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!userId.trim() || grantMutation.isPending}
          onClick={() =>
            grantMutation.mutate({
              userId: userId.trim(),
              amountXOF: Math.floor(Number(amountXOF) || 0),
            })
          }
        >
          {t("grantBtn")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!userId.trim()}
          onClick={() => setLookupUserId(userId.trim())}
        >
          {t("lookupBtn")}
        </Button>
      </div>

      {lookupUserId ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-700">
            {t("lotsFor", { userId: lookupUserId })}
          </p>
          {lotsQuery.isLoading ? (
            <p className="text-xs text-slate-500">{t("loading")}</p>
          ) : (lotsQuery.data ?? []).length === 0 ? (
            <p className="text-xs text-slate-500">{t("noLots")}</p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600">
              {(lotsQuery.data ?? []).map((lot) => (
                <li key={lot.id} className="flex justify-between gap-2">
                  <span>
                    {lot.remainingXOF.toLocaleString()} /{" "}
                    {lot.amountXOF.toLocaleString()} XOF · {lot.source}
                  </span>
                  <span>{lot.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </Card>
  );
}
