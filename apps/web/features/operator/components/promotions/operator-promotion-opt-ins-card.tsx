"use client";

import { useTranslations } from "next-intl";
import { Card } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { InfoTooltip } from "@/features/discounts/components/info-tooltip";

interface OptInCampaign {
  id: string;
  name: string;
  benefitType: string;
  percentBps?: number | null;
  companyOptIns: Array<{ status: string }>;
}

interface OperatorPromotionOptInsCardProps {
  campaigns: OptInCampaign[];
  onOptIn: (campaignId: string, status: "OPTED_IN" | "OPTED_OUT") => void;
  isPending: boolean;
}

export function OperatorPromotionOptInsCard({
  campaigns,
  onOptIn,
  isPending,
}: OperatorPromotionOptInsCardProps) {
  const t = useTranslations("operatorDashboard.promotions.optIns");
  const tTable = useTranslations("operatorDashboard.promotions.table");

  if (campaigns.length === 0) return null;

  function benefitLabel(item: {
    benefitType: string;
    percentBps?: number | null;
  }) {
    if (item.benefitType === "PERCENT_OFF")
      return tTable("percentOff", { percent: (item.percentBps ?? 0) / 100 });
    return item.benefitType;
  }

  return (
    <Card className="space-y-3 p-5 border-slate-200/80 shadow-xs">
      <div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-slate-900">{t("title")}</h2>
          <InfoTooltip content={t("tooltip")} />
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{t("description")}</p>
      </div>
      <ul className="space-y-2">
        {campaigns.map((c) => {
          const optInStatus = c.companyOptIns[0]?.status ?? "INVITED";
          const isOptedIn = optInStatus === "OPTED_IN";
          return (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                {isOptedIn && (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {c.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {benefitLabel(c)} ·{" "}
                    <span
                      className={`font-medium ${isOptedIn ? "text-emerald-600" : "text-slate-500"}`}
                    >
                      {isOptedIn
                        ? t("optedIn")
                        : optInStatus === "OPTED_OUT"
                          ? t("optedOut")
                          : t("invited")}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending || isOptedIn}
                  onClick={() => onOptIn(c.id, "OPTED_IN")}
                >
                  {t("optInBtn")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending || optInStatus === "OPTED_OUT"}
                  onClick={() => onOptIn(c.id, "OPTED_OUT")}
                >
                  {t("optOutBtn")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
