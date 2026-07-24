"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompanySettings } from "../api/use-company-settings";
import { cn } from "@moja/ui/lib/utils";
import { Building2, UserCircle, Landmark, ShieldCheck, Bell } from "lucide-react";

export function SettingsSidebar() {
  const pathname = usePathname();
  const { data: settings } = useCompanySettings();

  if (!settings?.operator) return null;

  const role = settings.operator.role;
  const perms = settings.operator.permissions || [];

  const navItems = [
    {
      title: "Company Profile",
      shortTitle: "Company",
      href: "/dashboard/operator/settings/company",
      icon: Building2,
      show: role === "OWNER" || perms.includes("company:view"),
    },
    {
      title: "Personal Profile",
      shortTitle: "Personal",
      href: "/dashboard/operator/settings/personal",
      icon: UserCircle,
      show: true, // Everyone can manage their own profile
    },
    {
      title: "Financials & Payouts",
      shortTitle: "Financials",
      href: "/dashboard/operator/settings/banking",
      icon: Landmark,
      show: role === "OWNER" || perms.includes("financials:view"),
    },
    {
      title: "Compliance & Docs",
      shortTitle: "Compliance",
      href: "/dashboard/operator/settings/compliance",
      icon: ShieldCheck,
      show: role === "OWNER" || perms.includes("company:update"),
    },
    {
      title: "Notifications",
      shortTitle: "Notifications",
      href: "/dashboard/operator/settings/notifications",
      icon: Bell,
      show: true,
    },
  ];

  const activeItems = navItems.filter((item) => item.show);

  return (
    <>
      {/* Mobile Header Sub-Navigation Bar */}
      <div className="md:hidden space-y-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your account preferences
          </p>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border scrollbar-none -mx-4 px-4">
          {activeItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                )}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.shortTitle}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Vertical Sidebar Navigation */}
      <nav className="hidden md:flex flex-col gap-1 pr-6 border-r border-border min-h-full">
        <div className="mb-6 px-3">
          <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account preferences
          </p>
        </div>

        {activeItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
