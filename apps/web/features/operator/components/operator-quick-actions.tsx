"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Radio, Route, CalendarClock, Bus, MapPin } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";

export function OperatorQuickActions() {
  const pathname = usePathname();
  const { can } = useStaffPermissions();

  const actions = [
    {
      label: "New Terminal",
      icon: MapPin,
      href: "/dashboard/operator/terminals?action=new",
      activePath: "/dashboard/operator/terminals",
      permission: "terminals:create" as const,
    },
    {
      label: "New Route",
      icon: Route,
      href: "/dashboard/operator/routes?action=new",
      activePath: "/dashboard/operator/routes",
      permission: "routes:create" as const,
    },
    {
      label: "New Schedule",
      icon: CalendarClock,
      href: "/dashboard/operator/schedules?action=new",
      activePath: "/dashboard/operator/schedules",
      permission: "schedules:create" as const,
    },
    {
      label: "Add Vehicle",
      icon: Bus,
      href: "/dashboard/operator/fleet?action=new",
      activePath: "/dashboard/operator/fleet",
      permission: "fleet:create" as const,
    },
    {
      label: "Dispatch Board",
      icon: Radio,
      href: "/dashboard/operator/trips",
      activePath: "/dashboard/operator/trips",
      permission: "trips:dispatch" as const,
    },
  ];

  return (
    <div className="ml-auto flex items-center gap-1.5">
      {actions
        .filter((act) => can(act.permission))
        .map((act) => {
          const isActive = pathname === act.activePath;
          const Icon = act.icon;

          return (
            <Button
              key={act.label}
              nativeButton={false}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-[11px] font-semibold px-2.5 gap-1.5 transition-all duration-150 shadow-none",
                isActive
                  ? "bg-primary hover:bg-primary/95 text-white"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
              render={<Link href={act.href} />}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{act.label}</span>
            </Button>
          );
        })}
    </div>
  );
}
