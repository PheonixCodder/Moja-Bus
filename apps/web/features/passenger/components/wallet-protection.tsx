"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";

export function WalletProtection() {
  const t = useTranslations("passengerDashboard.wallet");
  return (
    <Card className="border-border bg-bg-surface overflow-hidden shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-emerald-500" />
          {t("protectionTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="rounded-xl border border-slate-100 bg-bg-base p-4 space-y-3.5">
          <div className="flex gap-3">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-text-primary block">{t("consolidatedTreasury")}</span>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                {t("consolidatedTreasuryDesc")}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Lock className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-text-primary block">{t("paystackVerifiedTitle")}</span>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                {t("paystackVerifiedDesc")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
