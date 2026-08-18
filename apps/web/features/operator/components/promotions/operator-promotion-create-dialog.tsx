"use client";

import { useState } from "react";
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
  percentBps?: number;
  amountXOF?: number;
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
      percentBps: benefitType === "PERCENT_OFF" ? Math.round(Number(percentOff) * 100) : undefined,
      amountXOF: benefitType === "FIXED_AMOUNT_OFF" ? Number(amountXOF) : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-4 text-[#ee237c]" />
            {step === 1 ? "Create promotion" : "Set benefit value"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Name your promo and choose the discount type."
              : "Set the discount amount. You can add codes, routes, and limits after creation."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {step === 1 ? (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="op-promo-name">Promotion name</Label>
                  <InfoTooltip content="Promotional name for your discount, e.g. 'Weekend Special' or 'Holiday Flash Sale'." />
                </div>
                <Input
                  id="op-promo-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Weekend flash — 15% off"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Benefit type</Label>
                  <InfoTooltip content="Choose whether tickets receive a percentage discount or a fixed XOF reduction." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "PERCENT_OFF", label: "% Off", desc: "Percentage off ticket price" },
                      { value: "FIXED_AMOUNT_OFF", label: "Fixed XOF", desc: "Fixed amount off ticket" },
                    ] as { value: BenefitType; label: string; desc: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBenefitType(opt.value)}
                      className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                        benefitType === opt.value
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-semibold">{opt.label}</p>
                      <p className={`text-[11px] ${benefitType === opt.value ? "text-slate-300" : "text-slate-400"}`}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={!name.trim()} onClick={() => setStep(2)}>
                  Next →
                </Button>
              </div>
            </>
          ) : (
            <>
              {benefitType === "PERCENT_OFF" ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="op-percent">Discount percentage</Label>
                    <InfoTooltip content="Percentage off the ticket fare (e.g. 10 for 10% off)." />
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
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="op-amount">Discount amount</Label>
                    <InfoTooltip content="Fixed amount in XOF deducted from each ticket price." />
                  </div>
                  <div className="relative">
                    <Input
                      id="op-amount"
                      type="number"
                      value={amountXOF}
                      onChange={(e) => setAmountXOF(e.target.value)}
                      className="pr-12"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      XOF
                    </span>
                  </div>
                </div>
              )}

              <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                Starts as <strong>Draft</strong>. Add coupon codes and set scopes before activating.
              </p>

              <div className="flex justify-between gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={!name.trim() || isPending}
                    onClick={handleCreate}
                  >
                    {isPending ? "Creating…" : "Create draft"}
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
