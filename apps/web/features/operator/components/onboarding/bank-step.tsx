"use client";

import type { BankStepInput } from "@moja/schemas";
import { Button } from "@moja/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";
import { Field, FieldGroup, FieldLabel } from "@moja/ui/components/ui/field";
import { Input } from "@moja/ui/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Banknote, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";

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
  const t = useTranslations("onboarding.bank");
  const tRoot = useTranslations("onboarding");
  const trpc = useTRPC();
  const { data: paystackBanks, isLoading: isLoadingBanks } = useQuery(
    trpc.payments.listBanks.queryOptions({}),
  );

  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankType, setBankType] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [branch, setBranch] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [iban, setIban] = useState("");

  // Pre-fill form if initialData exists
  useEffect(() => {
    const bankAccount = initialData?.company?.bankAccounts?.[0];
    if (bankAccount) {
      const bank = bankAccount;
      setBankName(bank.bankName || "");
      setBankCode(bank.bankCode || "");
      setBankType(bank.verificationPayload?.type || "");
      const masked =
        typeof bank.accountNumber === "string" &&
        bank.accountNumber.includes("•");
      setAccountNumber(masked ? "" : bank.accountNumber || "");
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
      bankCode: bankCode || undefined,
      bankType: bankType || undefined,
      accountNumber,
      accountName,
      branch: branch || undefined,
      swiftCode: swiftCode || undefined,
      iban: iban || undefined,
    };

    await onSave(payload);
  };

  const canContinue = bankName && accountNumber && accountName;
  const isMobileMoney = bankType === "mobile_money";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Security Notice */}
      <Card className="border-green-200 bg-green-50/10 rounded-md">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-foreground">
                {t("securityTitle")}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("securityDesc")}
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
              <CardTitle className="text-lg font-bold">{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="bank-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("bankName")}
                </FieldLabel>
                <Combobox
                  items={(paystackBanks || []).map((b: any) => ({
                    value: b.code,
                    label: b.name,
                  }))}
                  value={bankCode}
                  onValueChange={(val) => {
                    setBankCode(val || "");
                    const matched = paystackBanks?.find(
                      (b: any) => b.code === val,
                    );
                    setBankName(matched ? matched.name : "");
                    setBankType(matched ? matched.type : "");
                  }}
                >
                  <ComboboxInput
                    id="bank-name"
                    placeholder={
                      isLoadingBanks ? t("loadingBanks") : t("selectBank")
                    }
                    aria-label={t("bankSearchPlaceholder")}
                    className="w-full text-sm"
                    value={bankName || ""}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>{t("noBankFound")}</ComboboxEmpty>
                    <ComboboxList>
                      {(paystackBanks || []).map((bank: any) => (
                        <ComboboxItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="account-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("accountHolder")}
                </FieldLabel>
                <Input
                  id="account-name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={t("accountHolderPlaceholder")}
                  required
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="account-number"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("accountNumber")}
                </FieldLabel>
                <Input
                  id="account-number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={
                    isMobileMoney
                      ? t("mobileMoneyPlaceholder")
                      : t("accountNumberPlaceholder")
                  }
                  required
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
                {bankCode ? (
                  <p className="text-[11px] text-muted-foreground">
                    {isMobileMoney
                      ? t("mobileMoneyHint")
                      : t("accountNumberHint")}
                  </p>
                ) : null}
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="branch"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("branch")}
                </FieldLabel>
                <Input
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder={t("branchPlaceholder")}
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="swift-code"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("swift")}
                </FieldLabel>
                <Input
                  id="swift-code"
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value)}
                  placeholder={t("swiftPlaceholder")}
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="iban"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("iban")}
                </FieldLabel>
                <Input
                  id="iban"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder={t("ibanPlaceholder")}
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </Field>
            </div>
          </FieldGroup>
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
          {tRoot("back")}
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !canContinue}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-md px-6 py-2"
        >
          {isSaving ? tRoot("saving") : tRoot("saveAndContinue")}
        </Button>
      </div>
    </form>
  );
}
