"use client";

import { Landmark, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@moja/ui/components/ui/card";

interface VerificationDetailsBanksProps {
  bankAccounts: any[];
}

export function VerificationDetailsBanks({ bankAccounts }: VerificationDetailsBanksProps) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900">
          Target Settlement Accounts
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Registered operator payout destinations. Default account mapped to recipient codes.
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
                        Default
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
                    {bank.isVerified ? "Verified" : "Pending Approval"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 mt-2 text-xs text-slate-500 border-t border-slate-50/50 pt-2.5">
                  <div>
                    <span className="font-medium text-slate-400">Account Holder</span>
                    <div className="font-semibold text-slate-800 mt-0.5 uppercase tracking-wide">
                      {bank.accountName}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-slate-400">Account Number</span>
                    <div className="font-semibold text-slate-800 mt-0.5 font-mono">
                      •••• •••• {bank.accountNumberLast4 || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 shadow-2xs">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">Payout Account Missing</div>
                <p className="text-[11px] leading-relaxed text-amber-600/90 font-medium">
                  The operator has not submitted bank details yet. Registration verification is blocked.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
