"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCompanySettings } from "../api/use-company-settings";
import { cn } from "@moja/ui/lib/utils";
import {
  Building2,
  UserCircle,
  Landmark,
  ShieldCheck,
  Bell,
} from "lucide-react";

export function SettingsSidebar() {
  const t = useTranslations("operatorDashboard.settings.nav");
  const pathname = usePathname();
  const { data: settings } = useCompanySettings();

  if (!settings?.operator) return null;

  const role = settings.operator.role;
  const perms = settings.operator.permissions || [];

  const navItems = [
    {
      title: t("company"),
      shortTitle: t("companyShort"),
      href: "/dashboard/operator/settings/company",
      icon: Building2,
      show:
        role === "OWNER" ||
        perms.includes("company:view") ||
        perms.includes("company:profile:update"),
    },
    {
      title: t("personal"),
      shortTitle: t("personalShort"),
      href: "/dashboard/operator/settings/personal",
      icon: UserCircle,
      show: true, // Everyone can manage their own profile
    },
    {
      title: t("banking"),
      shortTitle: t("bankingShort"),
      href: "/dashboard/operator/settings/banking",
      icon: Landmark,
      show:
        role === "OWNER" ||
        perms.includes("financials:view") ||
        perms.includes("company:banking:update"),
    },
    {
      title: t("compliance"),
      shortTitle: t("complianceShort"),
      href: "/dashboard/operator/settings/compliance",
      icon: ShieldCheck,
      show:
        role === "OWNER" ||
        perms.includes("company:view") ||
        perms.includes("company:compliance:update"),
    },
    {
      title: t("notifications"),
      shortTitle: t("notificationsShort"),
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
          <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("description")}
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
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-transparent",
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
          <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("description")}
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
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
