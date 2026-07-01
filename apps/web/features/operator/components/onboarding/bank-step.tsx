"use client";

import { useEffect, useState } from "react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Banknote, ShieldCheck } from "lucide-react";
import { type BankStepInput } from "@moja/schemas";

interface BankStepProps {
  initialData?: any;
  onSave: (data: BankStepInput) => Promise<boolean>;
  onBack: () => void;
  isSaving: boolean;
}

export function BankStep({
  initialData,
  onSave,
  onBack,
  isSaving,
}: BankStepProps) {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [branch, setBranch] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [iban, setIban] = useState("");

  const commonBanks = [
    "BICICI",
    "Banque de l'Union",
    "Ecobank",
    "Banque Atlantique",
    "SGBCI",
    "Standard Chartered",
    "CBAO",
    "Banque Internationale pour l'Afrique de l'Ouest (BIAO)",
    "Orabank",
    "Versus Bank",
    "Other",
  ];

  // Pre-fill form if initialData exists
  useEffect(() => {
    if (initialData?.company?.bankAccount) {
      const bank = initialData.company.bankAccount;
      setBankName(bank.bankName || "");
      setAccountNumber(bank.accountNumber || "");
      setAccountName(bank.accountName || "");
      setBranch(bank.branch || "");
      setSwiftCode(bank.swiftCode || "");
      setIban(bank.iban || "");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountName) {
      return;
    }

    const payload: BankStepInput = {
      bankName,
      accountNumber,
      accountName,
      branch: branch || undefined,
      swiftCode: swiftCode || undefined,
      iban: iban || undefined,
    };

    await onSave(payload);
  };

  const canContinue = bankName && accountNumber && accountName;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Security Notice */}
      <Card className="border-green-200 bg-green-50/10 rounded-md">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-foreground">
                Secure Payout Setup
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                We store and encrypt bank information. It is strictly used to
                distribute route revenues directly to your account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border rounded-md shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Payout Bank Account
              </CardTitle>
              <CardDescription>
                Provide the bank account details where you will receive ticket
                sales payouts.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="bank-name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Bank Name *
              </Label>
              <Combobox
                items={commonBanks.map((b) => ({ value: b, label: b }))}
                value={bankName}
                onValueChange={(val) => setBankName(val || "")}
              >
                <ComboboxInput
                  id="bank-name"
                  placeholder="Select bank"
                  className="w-full text-sm"
                  value={bankName || ""}
                />
                <ComboboxContent>
                  <ComboboxEmpty>No bank found.</ComboboxEmpty>
                  <ComboboxList>
                    {commonBanks.map((bank) => (
                      <ComboboxItem key={bank} value={bank}>
                        {bank}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="account-name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Account Holder Name *
              </Label>
              <Input
                id="account-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Must match company registration name"
                required
                className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="account-number"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Account Number *
              </Label>
              <Input
                id="account-number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
                required
                className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="branch"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Branch Code / Name
              </Label>
              <Input
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Plateau Branch"
                className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="swift-code"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                SWIFT / BIC Code
              </Label>
              <Input
                id="swift-code"
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value)}
                placeholder="e.g. ECOBCICIXXX"
                className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="iban"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                IBAN
              </Label>
              <Input
                id="iban"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="e.g. CI93 0123 4567 8901 2345 67"
                className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar container placeholder */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="border-border hover:bg-slate-100 rounded-md px-6 py-2"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !canContinue}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-md px-6 py-2"
        >
          {isSaving ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
}
