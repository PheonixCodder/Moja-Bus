"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Gift, Ticket } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTRPC } from "@/trpc/client";

export function PromoIncentivesPanel() {
  const t = useTranslations("passengerDashboard.wallet");
  const trpc = useTRPC();

  const vouchersQuery = useQuery(
    trpc.discounts.listMyVouchers.queryOptions({ includeExpired: false }),
  );
  const creditsQuery = useQuery(trpc.discounts.listMyCredits.queryOptions());

  const vouchers = vouchersQuery.data ?? [];
  const credits = creditsQuery.data ?? [];
  const creditTotal = credits.reduce(
    (sum, lot) => sum + Math.max(0, lot.remainingXOF - lot.reservedXOF),
    0,
  );

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t("promoTitle")}
          </h3>
          <p className="text-xs text-slate-500">{t("promoHint")}</p>
        </div>
        <Button asChild type="button" size="sm" variant="outline">
          <Link href="/dashboard/referrals">{t("promoReferralsCta")}</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <Gift className="size-4 text-[#ee237c]" />
          {t("promoCreditsTitle")}
        </div>
        <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
          {creditTotal.toLocaleString()} XOF
        </p>
        {credits.length === 0 ? (
          <p className="mt-1 text-xs text-slate-500">{t("promoCreditsEmpty")}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {credits.slice(0, 5).map((lot) => (
              <li
                key={lot.id}
                className="flex items-center justify-between gap-2 text-xs text-slate-600"
              >
                <span>
                  {Math.max(0, lot.remainingXOF - lot.reservedXOF).toLocaleString()}{" "}
                  XOF
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
        <p className="mt-2 text-[11px] text-slate-500">{t("promoVoucherCeiling")}</p>
      </div>
    </Card>
  );
}
