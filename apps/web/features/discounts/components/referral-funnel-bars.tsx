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
              <span className="font-medium text-foreground">{step.label}</span>
              <span className="tabular-nums text-muted-foreground">{step.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
