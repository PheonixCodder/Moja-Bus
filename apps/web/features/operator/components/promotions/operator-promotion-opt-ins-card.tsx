"use client";

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

function benefitLabel(item: { benefitType: string; percentBps?: number | null }) {
  if (item.benefitType === "PERCENT_OFF") return `${(item.percentBps ?? 0) / 100}% off`;
  return item.benefitType;
}

export function OperatorPromotionOptInsCard({
  campaigns,
  onOptIn,
  isPending,
}: OperatorPromotionOptInsCardProps) {
  if (campaigns.length === 0) return null;

  return (
    <Card className="space-y-3 p-5 border-slate-200/80 shadow-xs">
      <div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-slate-900">Platform campaigns — opt-in</h2>
          <InfoTooltip content="Nationwide or regional promotions organized by the platform. You can opt your company in or out at any time." />
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Platform promos available for your routes. Opt in to let passengers on your trips benefit from these deals.
        </p>
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
                {isOptedIn && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {benefitLabel(c)}{" "}
                    ·{" "}
                    <span className={`font-medium ${isOptedIn ? "text-emerald-600" : "text-slate-500"}`}>
                      {isOptedIn ? "Opted in" : optInStatus === "OPTED_OUT" ? "Opted out" : "Invited"}
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
                  Opt in
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending || optInStatus === "OPTED_OUT"}
                  onClick={() => onOptIn(c.id, "OPTED_OUT")}
                >
                  Opt out
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
