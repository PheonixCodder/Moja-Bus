"use client";

import { useBankAccounts } from "../api/use-bank-accounts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Landmark, ArrowRight, ShieldCheck, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@moja/ui/components/ui/badge";

interface BankSectionProps {
  onManage: () => void;
}

export function BankSection({ onManage }: BankSectionProps) {
  const { data: bankAccounts } = useBankAccounts();
  const defaultAccount = bankAccounts?.find(a => a.isDefault) || bankAccounts?.[0];

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-muted-foreground" />
            Payout Account
          </CardTitle>
          <CardDescription>Where you receive your settlements</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onManage}>
          Manage
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 mt-4">
        {defaultAccount ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-card shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{defaultAccount.bankName}</p>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    •••• •••• {defaultAccount.accountNumber?.slice(-4) || "****"}
                  </p>
                </div>
                {defaultAccount.isVerified ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                    <Clock className="w-3 h-3 mr-1" /> Pending Verification
                  </Badge>
                )}
              </div>
              
              <div className="pt-3 border-t grid grid-cols-2 text-sm gap-2">
                <div className="text-muted-foreground">Account Name</div>
                <div className="font-medium truncate" title={defaultAccount.accountName || ""}>
                  {defaultAccount.accountName}
                </div>
              </div>
            </div>

            {bankAccounts.length > 1 && (
              <p className="text-xs text-muted-foreground text-center">
                + {bankAccounts.length - 1} other account(s) on file
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg bg-muted/30">
            <Landmark className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="font-medium text-sm">No payout account</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Add a bank account to receive your ride settlements.
            </p>
            <Button variant="link" size="sm" className="mt-2" onClick={onManage}>
              Add Bank Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
