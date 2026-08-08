"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@moja/ui/components/ui/sidebar";
import { cn } from "@moja/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAvailableDashboards } from "@/lib/dash-boards";

interface DashboardSwitcherProps {
  userRole: string | null | undefined;
}

/**
 * Renders a "Switch Dashboard" section inside a sidebar.
 * Shows dashboard links accessible based on the user's role,
 * highlighting the one the user is currently viewing.
 * Only renders when the user has access to more than one dashboard.
 */
export function DashboardSwitcher({ userRole }: DashboardSwitcherProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const role = userRole ?? "TRAVELER";
  const dashboards = getAvailableDashboards(role);

  if (dashboards.length <= 1) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
        {t("switchDashboard")}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {dashboards.map((dashboard) => {
            const isActive =
              dashboard.href === "/dashboard"
                ? pathname === dashboard.href
                : pathname === dashboard.href ||
                  pathname.startsWith(`${dashboard.href}/`);

            return (
              <SidebarMenuItem key={dashboard.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  className={cn(
                    "h-9 rounded-md border border-transparent px-3 text-[13px] font-medium transition-colors duration-150",
                    "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive &&
                      "border-sidebar-primary/15 bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/10 hover:text-sidebar-primary",
                  )}
                  render={
                    <Link href={dashboard.href}>
                      <dashboard.icon className="size-4 shrink-0" />
                      <span>{dashboard.label}</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
