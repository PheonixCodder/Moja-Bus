export type AuthHeaderProps = {
  type: "passenger" | "operator";
  description: string;
};

export function AuthHeader({ type, description }: AuthHeaderProps) {
  const isOperator = type === "operator";

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Moja Ride</h1>
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground uppercase tracking-widest">
          {isOperator ? "for Business" : "Passenger Portal"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
