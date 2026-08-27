"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

import { useTranslations } from "next-intl";

export type BenefitType =
  | "PERCENT_OFF"
  | "FIXED_AMOUNT_OFF"
  | "WALLET_CREDIT_GRANT";

export interface CreateCampaignData {
  name: string;
  benefitType: BenefitType;
  percentBps?: number | undefined;
  amountXOF?: number | undefined;
  fundingType: "PLATFORM";
  minSubtotalXOF?: number | undefined;
  budgetXOF?: number | undefined;
  maxDiscountPerBookingXOF?: number | undefined;
  firstBookingOnly?: boolean | undefined;
  newUserOnly?: boolean | undefined;
  isAutoApply?: boolean | undefined;
}

interface AdminCampaignCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCampaignData) => Promise<void>;
  isPending: boolean;
}

export function AdminCampaignCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AdminCampaignCreateDialogProps) {
  const t = useTranslations("adminDashboard.campaigns.create");
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [benefitType, setBenefitType] = useState<BenefitType>("PERCENT_OFF");
  const [percentOff, setPercentOff] = useState("10");
  const [amountXOF, setAmountXOF] = useState("1000");

  // Step 2 optional controls
  const [budgetXOF, setBudgetXOF] = useState("");
  const [minSubtotalXOF, setMinSubtotalXOF] = useState("");
  const [maxDiscountXOF, setMaxDiscountXOF] = useState("");
  const [firstBookingOnly, setFirstBookingOnly] = useState(false);
  const [isAutoApply, setIsAutoApply] = useState(false);

  function reset() {
    setName("");
    setBenefitType("PERCENT_OFF");
    setPercentOff("10");
    setAmountXOF("1000");
    setBudgetXOF("");
    setMinSubtotalXOF("");
    setMaxDiscountXOF("");
    setFirstBookingOnly(false);
    setIsAutoApply(false);
    setStep(1);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    const payload: CreateCampaignData = {
      name: name.trim(),
      benefitType,
      fundingType: "PLATFORM",
      ...(benefitType === "PERCENT_OFF"
        ? { percentBps: Math.round(Number(percentOff || "0") * 100) }
        : { amountXOF: Number(amountXOF || "0") }),
      ...(budgetXOF ? { budgetXOF: Number(budgetXOF) } : {}),
      ...(minSubtotalXOF ? { minSubtotalXOF: Number(minSubtotalXOF) } : {}),
      ...(maxDiscountXOF
        ? { maxDiscountPerBookingXOF: Number(maxDiscountXOF) }
        : {}),
      firstBookingOnly,
      isAutoApply,
    };

    await onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {step === 1 ? t("step1Desc") : t("step2Desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="campaign-name">{t("name")}</Label>
                <Input
                  id="campaign-name"
                  placeholder={t("namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("benefitType")}</Label>
                  <Select
                    value={benefitType}
                    onValueChange={(v) => setBenefitType(v as BenefitType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT_OFF">
                        {t("benefitTypes.percent")}
                      </SelectItem>
                      <SelectItem value="FIXED_AMOUNT_OFF">
                        {t("benefitTypes.fixed")}
                      </SelectItem>
                      <SelectItem value="WALLET_CREDIT_GRANT">
                        {t("benefitTypes.walletCredit")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {benefitType === "PERCENT_OFF" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="percent-off">{t("discountPercent")}</Label>
                    <div className="relative">
                      <Input
                        id="percent-off"
                        type="number"
                        min="1"
                        max="100"
                        value={percentOff}
                        onChange={(e) => setPercentOff(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        %
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="amount-xof">{t("amountXOF")}</Label>
                    <Input
                      id="amount-xof"
                      type="number"
                      min="100"
                      step="100"
                      value={amountXOF}
                      onChange={(e) => setAmountXOF(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="budget-xof">{t("budgetLabel")}</Label>
                  <Input
                    id="budget-xof"
                    type="number"
                    placeholder={t("budgetPlaceholder")}
                    value={budgetXOF}
                    onChange={(e) => setBudgetXOF(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="min-subtotal">{t("minSubtotal")}</Label>
                  <Input
                    id="min-subtotal"
                    type="number"
                    placeholder={t("minSubtotalPlaceholder")}
                    value={minSubtotalXOF}
                    onChange={(e) => setMinSubtotalXOF(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max-discount">{t("maxDiscount")}</Label>
                <Input
                  id="max-discount"
                  type="number"
                  placeholder={t("maxDiscountPlaceholder")}
                  value={maxDiscountXOF}
                  onChange={(e) => setMaxDiscountXOF(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    checked={firstBookingOnly}
                    onChange={(e) => setFirstBookingOnly(e.target.checked)}
                  />
                  <span>{t("firstBookingOnly")}</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    checked={isAutoApply}
                    onChange={(e) => setIsAutoApply(e.target.checked)}
                  />
                  <span>{t("autoApply")}</span>
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isPending}
              >
                {t("back")}
              </Button>
            )}
            {step === 1 ? (
              <Button
                type="button"
                onClick={() => {
                  if (!name.trim()) {
                    toast.error(t("nameRequired"));
                    return;
                  }
                  setStep(2);
                }}
              >
                {t("nextBudget")}
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? t("creating") : t("createBtn")}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
