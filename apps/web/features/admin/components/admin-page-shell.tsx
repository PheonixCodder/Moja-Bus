import React, { ReactNode } from "react";
import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";

interface AdminPageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function AdminPageShell({
  title,
  description,
  actions,
  children,
  breadcrumbs,
}: AdminPageShellProps) {
  return (
    <div className="flex flex-col min-h-0 flex-1 bg-slate-50/50">
      {/* Header bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="h-4 bg-border" />
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="text-slate-400">Admin</span>
            {breadcrumbs?.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span className="text-slate-300">/</span>
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-primary transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-slate-700 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header Title Section */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Children component */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
