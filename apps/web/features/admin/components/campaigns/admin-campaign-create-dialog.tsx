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

export type BenefitType = "PERCENT_OFF" | "FIXED_AMOUNT_OFF" | "WALLET_CREDIT_GRANT";

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
      toast.error("Campaign name is required");
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
      ...(maxDiscountXOF ? { maxDiscountPerBookingXOF: Number(maxDiscountXOF) } : {}),
      firstBookingOnly,
      isAutoApply,
    };

    await onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Marketing Campaign</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Set up the core discount incentive and campaign name."
              : "Configure budget limits, guardrails, and stacking rules."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="campaign-name">Campaign name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g. Summer Holiday Rush 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Benefit type</Label>
                  <Select
                    value={benefitType}
                    onValueChange={(v) => setBenefitType(v as BenefitType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT_OFF">Percent discount (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT_OFF">Fixed discount (XOF)</SelectItem>
                      <SelectItem value="WALLET_CREDIT_GRANT">Promo wallet credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {benefitType === "PERCENT_OFF" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="percent-off">Discount percentage</Label>
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
                    <Label htmlFor="amount-xof">Amount (XOF)</Label>
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
                  <Label htmlFor="budget-xof">Total campaign budget (XOF)</Label>
                  <Input
                    id="budget-xof"
                    type="number"
                    placeholder="Optional (unlimited)"
                    value={budgetXOF}
                    onChange={(e) => setBudgetXOF(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="min-subtotal">Min ticket subtotal (XOF)</Label>
                  <Input
                    id="min-subtotal"
                    type="number"
                    placeholder="Optional"
                    value={minSubtotalXOF}
                    onChange={(e) => setMinSubtotalXOF(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max-discount">Max discount per booking (XOF)</Label>
                <Input
                  id="max-discount"
                  type="number"
                  placeholder="Optional cap for percent discounts"
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
                  <span>First booking only (new riders)</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    checked={isAutoApply}
                    onChange={(e) => setIsAutoApply(e.target.checked)}
                  />
                  <span>Auto-apply to eligible bookings without promo code</span>
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
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button
                type="button"
                onClick={() => {
                  if (!name.trim()) {
                    toast.error("Campaign name is required");
                    return;
                  }
                  setStep(2);
                }}
              >
                Next: Budget & Rules
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Campaign"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
