"use client";

import { CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import {
  WIZARD_STEPS,
  type WizardStep,
} from "@/features/operator/lib/schedules/types";

export function WizardStepper({
  current,
  onStepClick,
  maxReached,
}: {
  current: WizardStep;
  onStepClick: (s: WizardStep) => void;
  maxReached: number;
}) {
  return (
    <div className="flex items-center gap-0 border-b border-border bg-slate-50/50 px-5 py-3 shrink-0">
      {WIZARD_STEPS.map((step, i) => {
        const idx = WIZARD_STEPS.indexOf(current);
        const isActive = step === current;
        const isCompleted = i < idx;
        const isClickable = i <= maxReached;

        return (
          <div key={step} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                isActive && "bg-primary/10 text-primary",
                isCompleted && !isActive && "text-green-600 hover:bg-green-50",
                !isActive && !isCompleted && "text-muted-foreground",
                isClickable && !isActive && "hover:bg-slate-100 cursor-pointer",
                !isClickable && "cursor-not-allowed opacity-40",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[10px] font-bold",
                  isActive && "border-primary bg-primary text-white",
                  isCompleted && "border-green-600 bg-green-600 text-white",
                  !isActive &&
                    !isCompleted &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {isCompleted ? <CheckCircle2 className="size-3" /> : i + 1}
              </span>
              {step}
            </button>
            {i < WIZARD_STEPS.length - 1 && (
              <ChevronRight className="size-3.5 text-border mx-1 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
