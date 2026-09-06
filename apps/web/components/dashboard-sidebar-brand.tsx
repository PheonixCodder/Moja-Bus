"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@moja/ui/components/ui/sidebar";

interface DashboardSidebarBrandProps {
  href: string;
}

/**
 * Shared sidebar brand header for passenger, operator, and admin dashboards.
 * Matches the passenger dashboard treatment: icon + MojaRide wordmark link.
 */
export function DashboardSidebarBrand({ href }: DashboardSidebarBrandProps) {
  const t = useTranslations("dashboardBrand");
  const label = `${t("appName")} ${t("appSuffix")}`;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="default"
          render={
            <Link
              prefetch={false}
              href={href}
              className="flex items-center gap-2"
            >
              <Image
                src="/images/moja-icon.svg"
                alt=""
                width={14}
                height={16}
                className="h-4 w-auto shrink-0"
                unoptimized
              />
              <span className="font-semibold text-base tracking-tight text-sidebar-foreground">
                {t("appName")}
                <span className="text-primary font-bold">{t("appSuffix")}</span>
              </span>
            </Link>
          }
          tooltip={label}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
