"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Zap } from "lucide-react";
import { InfoTooltip } from "@/features/discounts/components/info-tooltip";

type BenefitType = "PERCENT_OFF" | "FIXED_AMOUNT_OFF";

export interface CreatePromoData {
  name: string;
  benefitType: BenefitType;
  percentBps?: number | undefined;
  amountXOF?: number | undefined;
}

interface OperatorPromotionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreatePromoData) => void;
  isPending: boolean;
}

export function OperatorPromotionCreateDialog({
  open,
  onOpenChange,
  onCreate,
  isPending,
}: OperatorPromotionCreateDialogProps) {
  const t = useTranslations("operatorDashboard.promotions.createDialog");
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [benefitType, setBenefitType] = useState<BenefitType>("PERCENT_OFF");
  const [percentOff, setPercentOff] = useState("10");
  const [amountXOF, setAmountXOF] = useState("1000");

  function reset() {
    setStep(1);
    setName("");
    setBenefitType("PERCENT_OFF");
    setPercentOff("10");
    setAmountXOF("1000");
  }

  function handleOpenChange(o: boolean) {
    if (!o) reset();
    onOpenChange(o);
  }

  function handleCreate() {
    onCreate({
      name: name.trim(),
      benefitType,
      ...(benefitType === "PERCENT_OFF"
        ? { percentBps: Math.round(Number(percentOff) * 100) }
        : {}),
      ...(benefitType === "FIXED_AMOUNT_OFF"
        ? { amountXOF: Number(amountXOF) }
        : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            {step === 1 ? t("step1Title") : t("step2Title")}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? t("step1Desc") : t("step2Desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {step === 1 ? (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="op-promo-name">{t("promoName")}</Label>
                  <InfoTooltip content={t("promoNameTooltip")} />
                </div>
                <Input
                  id="op-promo-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("promoNamePlaceholder")}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>{t("benefitType")}</Label>
                  <InfoTooltip content={t("benefitTypeTooltip")} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        value: "PERCENT_OFF",
                        label: t("percentOff"),
                        desc: t("percentOffDesc"),
                      },
                      {
                        value: "FIXED_AMOUNT_OFF",
                        label: t("fixedXOF"),
                        desc: t("fixedXOFDesc"),
                      },
                    ] as { value: BenefitType; label: string; desc: string }[]
                  ).map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      variant="ghost"
                      onClick={() => setBenefitType(opt.value)}
                      className={`h-auto rounded-lg border px-3 py-3 text-left text-sm transition-colors flex flex-col items-start justify-start whitespace-normal font-normal ${
                        benefitType === opt.value
                          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-foreground/20 hover:bg-muted/50"
                      }`}
                    >
                      <p className="font-semibold">{opt.label}</p>
                      <p
                        className={`text-[11px] ${benefitType === opt.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                      >
                        {opt.desc}
                      </p>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  disabled={!name.trim()}
                  onClick={() => setStep(2)}
                >
                  {t("next")}
                </Button>
              </div>
            </>
          ) : (
            <>
              {benefitType === "PERCENT_OFF" ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="op-percent">{t("discountPercent")}</Label>
                    <InfoTooltip content={t("discountPercentTooltip")} />
                  </div>
                  <div className="relative">
                    <Input
                      id="op-percent"
                      type="number"
                      min={1}
                      max={100}
                      value={percentOff}
                      onChange={(e) => setPercentOff(e.target.value)}
                      className="pr-8"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="op-amount">{t("discountAmount")}</Label>
                    <InfoTooltip content={t("discountAmountTooltip")} />
                  </div>
                  <div className="relative">
                    <Input
                      id="op-amount"
                      type="number"
                      value={amountXOF}
                      onChange={(e) => setAmountXOF(e.target.value)}
                      className="pr-12"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      XOF
                    </span>
                  </div>
                </div>
              )}

              <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                {t("draftNotice")}
              </p>

              <div className="flex justify-between gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                >
                  {t("back")}
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="button"
                    disabled={!name.trim() || isPending}
                    onClick={handleCreate}
                  >
                    {isPending ? t("creating") : t("createDraft")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
