"use client";

import { ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";

export function WalletProtection() {
  return (
    <Card className="border-border bg-bg-surface overflow-hidden shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-emerald-500" />
          Wallet Protection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="rounded-xl border border-slate-100 bg-bg-base p-4 space-y-3.5">
          <div className="flex gap-3">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-text-primary block">Consolidated Treasury</span>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                All wallet balances are securely held in Moja's consolidated clearing treasury account.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Lock className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-text-primary block">Paystack Verified</span>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                Encrypted checkouts and instant settlements via verified SSL pipelines.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
