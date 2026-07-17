"use client";

import Link from "next/link";
import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardHeaderProps {
  breadcrumbs: BreadcrumbItem[];
}

export function DashboardHeader({ breadcrumbs }: DashboardHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
      <SidebarTrigger className="text-text-muted hover:text-text-primary" />
      <Separator orientation="vertical" className="h-4 bg-border" />
      <nav className="flex items-center gap-1 text-xs text-text-muted">
        {breadcrumbs.map((item, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <div key={item.label} className="flex items-center">
              {idx > 0 && <span className="mx-1 text-text-muted/40">/</span>}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-text-primary font-medium" : ""}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </header>
  );
}
