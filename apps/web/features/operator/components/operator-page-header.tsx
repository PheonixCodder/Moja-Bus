import { Separator } from "@moja/ui/components/ui/separator";
import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { cn } from "@moja/ui/lib/utils";

type OperatorPageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Shared header for all operator dashboard pages.
 * Mirrors the passenger-side `PageHeader` but exposes an optional
 * `description` slot for richer context.
 */
export function OperatorPageHeader({
  title,
  description,
  actions,
  className,
}: OperatorPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="lg:hidden" />
        <Separator orientation="vertical" className="h-5 lg:hidden" />
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground leading-none">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
