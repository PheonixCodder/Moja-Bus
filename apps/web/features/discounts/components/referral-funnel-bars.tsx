type FunnelStep = {
  key: string;
  label: string;
  count: number;
};

export function ReferralFunnelBars({
  steps,
  className,
}: {
  steps: FunnelStep[];
  className?: string;
}) {
  const max = Math.max(1, ...steps.map((s) => s.count));

  return (
    <div className={className ?? "space-y-3"}>
      {steps.map((step) => {
        const pct = Math.round((step.count / max) * 100);
        return (
          <div key={step.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{step.label}</span>
              <span className="tabular-nums text-slate-500">{step.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#ee237c] transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
