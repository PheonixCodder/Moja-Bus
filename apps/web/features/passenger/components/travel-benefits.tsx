"use client";

import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";

export function TravelBenefits() {
  const t = useTranslations("passengerDashboard.wallet");
  return (
    <Card className="border-border bg-bg-surface overflow-hidden shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
          <TrendingUp className="size-4 text-primary" />
          {t("benefitsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 text-[10px]">
              1
            </div>
            <div>
              <span className="font-semibold text-text-primary block">{t("instantBooking")}</span>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                {t("instantBookingDesc")}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 text-[10px]">
              2
            </div>
            <div>
              <span className="font-semibold text-text-primary block">{t("oneClickRefunds")}</span>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                {t("oneClickRefundsDesc")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
