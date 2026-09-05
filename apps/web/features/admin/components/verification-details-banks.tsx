"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Landmark, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

interface VerificationDetailsBanksProps {
  bankAccounts: any[];
}

export function VerificationDetailsBanks({
  bankAccounts,
}: VerificationDetailsBanksProps) {
  const t = useTranslations("adminDashboard.verificationDetailsBanks");
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-foreground">
          {t("targetSettlementAccounts")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("settlementAccountsDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {bankAccounts && bankAccounts.length > 0 ? (
            bankAccounts.map((bank) => (
              <div
                key={bank.id}
                className="border border-border rounded-lg p-4 bg-card space-y-3 shadow-2xs"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Landmark className="size-4.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground text-sm">
                      {bank.bankName}
                    </span>
                    {bank.isDefault && (
                      <span className="text-[9px] font-bold bg-success text-success-foreground px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                        {t("default")}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none ${
                      bank.isVerified
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-warning/10 text-warning border border-warning/20"
                    }`}
                  >
                    {bank.isVerified ? t("verified") : t("pendingApproval")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 mt-2 text-xs text-muted-foreground border-t border-border pt-2.5">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      {t("accountHolder")}
                    </span>
                    <div className="font-semibold text-foreground mt-0.5 uppercase tracking-wide">
                      {bank.accountName}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      {t("accountNumber")}
                    </span>
                    <div className="font-semibold text-foreground mt-0.5 font-mono">
                      •••• •••• {bank.accountNumberLast4 || t("na")}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg p-4 flex gap-3 shadow-2xs">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">{t("payoutAccountMissing")}</div>
                <p className="text-[11px] leading-relaxed text-warning font-medium">
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
