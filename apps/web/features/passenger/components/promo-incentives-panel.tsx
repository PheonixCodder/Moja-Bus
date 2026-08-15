"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Gift, Ticket } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";
import { useTRPC } from "@/trpc/client";

function sourceLabel(
  source: string,
  t: ReturnType<typeof useTranslations<"passengerDashboard.wallet">>,
): string {
  switch (source) {
    case "REFERRAL":
      return t("promoSourceReferral");
    case "ADMIN":
      return t("promoSourceAdmin");
    case "PROMO_GRANT":
      return t("promoSourcePromo");
    case "LOYALTY":
      return t("promoSourceLoyalty");
    default:
      return source;
  }
}

export function PromoIncentivesPanel() {
  const t = useTranslations("passengerDashboard.wallet");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [claimCode, setClaimCode] = useState("");

  const vouchersQuery = useQuery(
    trpc.discounts.listMyVouchers.queryOptions({ includeExpired: false }),
  );
  const lotsQuery = useQuery(trpc.discounts.listMyCreditLots.queryOptions());
  const policyQuery = useQuery(trpc.discounts.getPromoPolicyPublic.queryOptions());
  const programQuery = useQuery(
    trpc.discounts.getReferralProgramPublic.queryOptions(),
  );

  const claimMutation = useMutation(
    trpc.discounts.claimCreditGrant.mutationOptions({
      onSuccess: async () => {
        toast.success(t("promoClaimSuccess"));
        setClaimCode("");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discounts.listMyCredits.pathFilter()),
          queryClient.invalidateQueries(
            trpc.discounts.listMyCreditLots.pathFilter(),
          ),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const lots = lotsQuery.data ?? [];
  const available = lots.filter(
    (l) => l.status === "ACTIVE" || l.status === "PARTIALLY_REDEEMED",
  );
  const pending = lots.filter((l) => l.status === "PENDING");
  const creditTotal = available.reduce(
    (sum, lot) => sum + Math.max(0, lot.remainingXOF - lot.reservedXOF),
    0,
  );
  const vouchers = vouchersQuery.data ?? [];
  const maxVouchers = policyQuery.data?.maxPromotionalVouchersPerUser ?? 3;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t("promoTitle")}
          </h3>
          <p className="text-xs text-slate-500">{t("promoHint")}</p>
          <p className="mt-1 text-xs text-slate-500">{t("promoHowToEarn")}</p>
          {programQuery.data?.isActive &&
          programQuery.data.referrerCreditAmountXOF > 0 ? (
            <p className="mt-1 text-xs text-slate-600">
              {programQuery.data.referrerCreditAmountXOF.toLocaleString()} XOF{" "}
              {t("promoSourceReferral").toLowerCase()}
            </p>
          ) : null}
        </div>
        <Link
          href="/dashboard/referrals"
          className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
        >
          {t("promoReferralsCta")}
        </Link>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-100 bg-white p-3">
        <Labelish>{t("promoClaimLabel")}</Labelish>
        <div className="flex gap-2">
          <Input
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            placeholder={t("promoClaimPlaceholder")}
            className="h-9"
          />
          <Button
            type="button"
            size="sm"
            disabled={!claimCode.trim() || claimMutation.isPending}
            onClick={async () => {
              const { getDeviceHash } = await import(
                "@/features/discounts/lib/device-hash"
              );
              const deviceHash = await getDeviceHash();
              claimMutation.mutate({
                code: claimCode.trim(),
                ...(deviceHash ? { deviceHash } : {}),
              });
            }}
          >
            {t("promoClaimCta")}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <Gift className="size-4 text-[#ee237c]" />
          {t("promoCreditsTitle")}
        </div>
        <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
          {creditTotal.toLocaleString()} XOF
        </p>
        {available.length === 0 ? (
          <p className="mt-1 text-xs text-slate-500">{t("promoCreditsEmpty")}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {available.slice(0, 5).map((lot) => (
              <li
                key={lot.id}
                className="flex items-center justify-between gap-2 text-xs text-slate-600"
              >
                <span>
                  {Math.max(0, lot.remainingXOF - lot.reservedXOF).toLocaleString()}{" "}
                  XOF · {sourceLabel(lot.source, t)}
                  {lot.expiresAt
                    ? ` · ${t("promoExpires", {
                        date: format(new Date(lot.expiresAt), "dd MMM yyyy"),
                      })}`
                    : ""}
                </span>
                <Badge variant="secondary">{lot.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pending.length > 0 ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
          <p className="text-sm font-medium text-slate-900">
            {t("promoCreditsPending")}
          </p>
          <ul className="mt-2 space-y-1.5">
            {pending.slice(0, 5).map((lot) => (
              <li
                key={lot.id}
                className="flex items-center justify-between gap-2 text-xs text-slate-600"
              >
                <span>
                  {lot.amountXOF.toLocaleString()} XOF ·{" "}
                  {sourceLabel(lot.source, t)}
                  {lot.availableAt
                    ? ` · ${t("promoAvailableAt", {
                        date: format(new Date(lot.availableAt), "dd MMM yyyy"),
                      })}`
                    : ""}
                </span>
                <Badge variant="secondary">{lot.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <Ticket className="size-4 text-[#ee237c]" />
          {t("promoVouchersTitle")}
        </div>
        {vouchers.length === 0 ? (
          <p className="mt-1 text-xs text-slate-500">{t("promoVouchersEmpty")}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {vouchers.slice(0, 8).map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-2 text-xs text-slate-600"
              >
                <span>
                  {v.remainingAmountXOF.toLocaleString()} XOF
                  {v.code ? ` · ${v.code}` : ""}
                  {v.expiresAt
                    ? ` · ${t("promoExpires", {
                        date: format(new Date(v.expiresAt), "dd MMM yyyy"),
                      })}`
                    : ""}
                </span>
                <Badge variant="secondary">{v.source}</Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-slate-500">
          {t("promoVoucherCeiling", { max: maxVouchers })}
        </p>
      </div>
    </Card>
  );
}

function Labelish({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-slate-700">{children}</p>;
}
