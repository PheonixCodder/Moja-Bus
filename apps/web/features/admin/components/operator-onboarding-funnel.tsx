"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@moja/ui/components/ui/card";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Activity } from "lucide-react";

const STEP_ORDER = ["COMPANY", "DOCUMENTS", "BANK", "PROFILE", "TERMS"];

export function OperatorOnboardingFunnel() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.admin.getOnboardingFunnel.queryOptions()
  );

  if (isLoading) {
    return (
      <Card className="bg-white border-border shadow-sm">
        <CardContent className="p-6 flex items-center justify-center min-h-[160px]">
          <Spinner className="size-6 text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // We map the steps to display them in logical order, showing how many are stuck at each step.
  const stepCounts = STEP_ORDER.map(stepName => {
    const match = data.steps.find(s => s.step === stepName);
    return {
      name: stepName,
      count: match?.count || 0,
    };
  });

  const maxCount = Math.max(...stepCounts.map(s => s.count), 1); // Avoid division by zero

  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Onboarding Funnel Drop-off
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Number of operators currently stalled at each step
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-5 gap-2 h-32 items-end">
            {stepCounts.map((s, i) => {
              const heightPct = Math.max((s.count / maxCount) * 100, 5); // min 5% height for visibility
              return (
                <div key={s.name} className="flex flex-col items-center gap-2 group">
                  <div className="text-xs font-bold text-slate-700">
                    {s.count}
                  </div>
                  <div 
                    className="w-full bg-primary/20 rounded-t-sm transition-all group-hover:bg-primary/40 relative"
                    style={{ height: `${heightPct}%` }}
                  >
                    {/* Active bar */}
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-primary rounded-t-sm transition-all"
                      style={{ height: s.count > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">
                    {s.name}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-500">
              Total Started: <strong className="text-slate-800">{data.totalStarted}</strong>
            </div>
            <div className="text-xs font-medium text-slate-500">
              Fully Completed: <strong className="text-slate-800">{data.totalCompleted}</strong>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
