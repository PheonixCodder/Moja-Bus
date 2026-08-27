"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { formatXOF } from "../../lib/currency";
import { toSafeDisplayNumber } from "@/lib/money";

export function ArrearsAlertBanner({
  availableBalance,
}: {
  availableBalance: string | number;
}) {
  const t = useTranslations("operatorDashboard.revenue.arrears");
  const balance = toSafeDisplayNumber(availableBalance);

  if (balance >= 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start sm:items-center gap-4">
      <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
        <AlertTriangle className="h-5 w-5 text-red-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-red-800">
          {t("title", { balance: formatXOF(balance) })}
        </h3>
        <p className="text-sm text-red-700 mt-1">{t("description")}</p>
      </div>
    </div>
  );
}
