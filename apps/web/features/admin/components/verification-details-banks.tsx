"use client";

import { Landmark, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@moja/ui/components/ui/card";
import { useTranslations } from "next-intl";

interface VerificationDetailsBanksProps {
  bankAccounts: any[];
}

export function VerificationDetailsBanks({ bankAccounts }: VerificationDetailsBanksProps) {
  const t = useTranslations("adminDashboard.verificationDetailsBanks");
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900">
          {t("targetSettlementAccounts")}
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          {t("settlementAccountsDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {bankAccounts && bankAccounts.length > 0 ? (
            bankAccounts.map((bank) => (
              <div
                key={bank.id}
                className="border border-slate-100 rounded-lg p-4 bg-white space-y-3 shadow-2xs"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Landmark className="size-4.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 text-sm">{bank.bankName}</span>
                    {bank.isDefault && (
                      <span className="text-[9px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                        {t("default")}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none ${
                      bank.isVerified
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    }`}
                  >
                    {bank.isVerified ? t("verified") : t("pendingApproval")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 mt-2 text-xs text-slate-500 border-t border-slate-50/50 pt-2.5">
                  <div>
                    <span className="font-medium text-slate-400">{t("accountHolder")}</span>
                    <div className="font-semibold text-slate-800 mt-0.5 uppercase tracking-wide">
                      {bank.accountName}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-slate-400">{t("accountNumber")}</span>
                    <div className="font-semibold text-slate-800 mt-0.5 font-mono">
                      •••• •••• {bank.accountNumberLast4 || t("na")}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 shadow-2xs">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">{t("payoutAccountMissing")}</div>
                <p className="text-[11px] leading-relaxed text-amber-600/90 font-medium">
                  {t("payoutAccountMissingDescription")}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
