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
      href: "/dashboard/operator/settings/company",
      icon: Building2,
      show: role === "OWNER" || perms.includes("company:view"),
    },
    {
      title: "Personal Profile",
      href: "/dashboard/operator/settings/personal",
      icon: UserCircle,
      show: true, // Everyone can manage their own profile
    },
    {
      title: "Financials & Payouts",
      href: "/dashboard/operator/settings/banking",
      icon: Landmark,
      show: role === "OWNER" || perms.includes("financials:view"),
    },
    {
      title: "Compliance & Docs",
      href: "/dashboard/operator/settings/compliance",
      icon: ShieldCheck,
      show: role === "OWNER" || perms.includes("company:update"),
    },
    {
      title: "Notifications",
      href: "/dashboard/operator/settings/notifications",
      icon: Bell,
      show: true,
    },
  ];

  return (
    <nav className="flex flex-col gap-1 pr-6 border-r border-border min-h-[calc(100vh-theme(spacing.24))]">
      <div className="mb-6 px-3">
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>
      
      {navItems.filter(item => item.show).map((item) => {
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
  );
}
