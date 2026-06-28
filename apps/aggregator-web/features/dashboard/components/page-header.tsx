import { Separator } from "@moja/ui/components/ui/separator";
import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";

type PageHeaderProps = {
  title: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <div
      className={`flex h-16 items-center justify-between border-b border-border bg-bg-surface px-4 ${className ?? ""}`}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="lg:hidden" />
        <Separator orientation="vertical" className="h-5 lg:hidden" />
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
