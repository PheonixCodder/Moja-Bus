"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type LucideIcon,
  BusFront,
  LogOut,
  Settings,
  Map,
  CalendarClock,
  Radio,
  Gauge,
  ChevronsUpDown,
  MapPin,
  Users,
  Ticket,
  TrendingUp,
  Banknote,
  Star,
  ShieldCheck,
  Shield,
  Tag,
  UserCheck,
  Store,
  SendHorizonal,
} from "lucide-react";


import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@moja/ui/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@moja/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@moja/ui/components/ui/sidebar";
import { DashboardSwitcher } from "@/components/dashboard-switcher";
import { getCompanyStatusPresentation } from "@/features/operator/lib/company-status";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";
import { useTRPC } from "@/trpc/client";
import type { User } from "@/lib/auth-client";
import type { PermissionKey } from "@moja/schemas";

type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  /** Any of these permissions unlocks the item. Omit = always visible. */
  permissions?: PermissionKey[];
};

function isActivePath(pathname: string, path: string) {
  if (path === "/dashboard/operator") {
    return pathname === path;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

interface NavSectionProps {
  label?: string;
  items: NavItem[];
  pathname: string;
  can: (key: PermissionKey) => boolean;
}

function NavSection({ label, items, pathname, can }: NavSectionProps) {
  const visible = items.filter(
    (item) =>
      !item.permissions?.length ||
      item.permissions.some((key) => can(key)),
  );

  if (visible.length === 0) return null;

  return (
    <SidebarGroup>
      {label ? (
        <SidebarGroupLabel className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          {label}
        </SidebarGroupLabel>
      ) : null}
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {visible.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.path);
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={item.label}
                  render={<Link href={item.path} />}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

interface OperatorSidebarProps {
  user: User | null;
}

export function OperatorSidebar({ user }: OperatorSidebarProps) {
  const t = useTranslations("operatorDashboard.nav");
  const pathname = usePathname();
  const sidebar = useSidebar();
  const { signOut } = useAuth();
  const trpc = useTRPC();
  const { can } = useStaffPermissions();

  const { data } = useSuspenseQuery(trpc.operator.getShellContext.queryOptions());
  const status = data?.company?.status;
  const statusPresentation = getCompanyStatusPresentation(status);

  const operationsItems: NavItem[] = [
    { id: "overview", label: t("overview"), path: "/dashboard/operator", icon: Gauge, permissions: ["trips:read", "bookings:read", "company:view"] },
    {
      id: "dispatch-board",
      label: t("dispatchBoard"),
      path: "/dashboard/operator/trips",
      icon: Radio,
      permissions: ["trips:read"],
    },
    {
      id: "bookings",
      label: t("bookings"),
      path: "/dashboard/operator/bookings",
      icon: Ticket,
      permissions: ["bookings:read"],
    },
    {
      id: "reviews",
      label: t("reviews"),
      path: "/dashboard/operator/reviews",
      icon: Star,
      permissions: ["reviews:read"],
    },
  ];

  const planningItems: NavItem[] = [
    {
      id: "terminals",
      label: t("terminals"),
      path: "/dashboard/operator/terminals",
      icon: MapPin,
      permissions: ["terminals:read"],
    },
    {
      id: "routes",
      label: t("routes"),
      path: "/dashboard/operator/routes",
      icon: Map,
      permissions: ["routes:read"],
    },
    {
      id: "schedules",
      label: t("schedules"),
      path: "/dashboard/operator/schedules",
      icon: CalendarClock,
      permissions: ["schedules:read"],
    },
  ];

  const fleetItems: NavItem[] = [
    {
      id: "buses",
      label: t("buses"),
      path: "/dashboard/operator/fleet",
      icon: BusFront,
      permissions: ["fleet:read"],
    },
    {
      id: "drivers",
      label: t("drivers"),
      path: "/dashboard/operator/drivers",
      icon: UserCheck,
      permissions: ["drivers:read"],
    },
  ];

  const talentItems: NavItem[] = [
    {
      id: "driver-marketplace",
      label: t("driverMarketplace"),
      path: "/dashboard/operator/drivers/marketplace",
      icon: Store,
      permissions: ["drivers:read"],
    },
    {
      id: "sent-offers",
      label: t("sentOffers"),
      path: "/dashboard/operator/drivers/offers",
      icon: SendHorizonal,
      permissions: ["drivers:read"],
    },
  ];

  const financialsItems: NavItem[] = [
    {
      id: "revenue",
      label: t("revenue"),
      path: "/dashboard/operator/revenue",
      icon: TrendingUp,
      permissions: ["revenue:view"],
    },
    {
      id: "withdrawals",
      label: t("withdrawals"),
      path: "/dashboard/operator/withdraw",
      icon: Banknote,
      permissions: ["withdrawals:view"],
    },
  ];

  const growthItems: NavItem[] = [
    {
      id: "promotions",
      label: t("promotions"),
      path: "/dashboard/operator/promotions",
      icon: Tag,
      permissions: ["promotions:read"],
    },
  ];

  const organizationItems: NavItem[] = [
    {
      id: "company",
      label: t("company"),
      path: "/dashboard/operator/settings",
      icon: Settings,
      permissions: ["company:view"],
    },
    {
      id: "staff",
      label: t("staff"),
      path: "/dashboard/operator/staff",
      icon: Users,
      permissions: ["staff:read"],
    },
  ];

  const userInitials = user?.name
    ? user.name
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
    : "OP";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="flex flex-col gap-4 px-3 pt-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary/10 transition-all duration-300 ease-in-out",
              sidebar.state === "collapsed" &&
                "group cursor-pointer hover:bg-sidebar-accent",
            )}
          >
            {sidebar.state === "collapsed" ? (
              <>
                <SidebarTrigger
                  className={cn(
                    "flex h-full items-center justify-center p-0 text-sidebar-foreground/50 transition-all duration-300 ease-in-out",
                    "w-0 scale-90 opacity-0 group-hover:w-full group-hover:scale-100 group-hover:opacity-100",
                    "hover:text-sidebar-foreground",
                  )}
                />
                <BusFront
                  className={cn(
                    "size-4.5 shrink-0 text-sidebar-primary transition-all duration-300 ease-in-out",
                    "group-hover:w-0 group-hover:scale-75 group-hover:opacity-0",
                  )}
                />
              </>
            ) : (
              <BusFront className="size-4.5 text-sidebar-primary" />
            )}
          </div>

          <div className="group-data-[collapsible=icon]:hidden flex flex-col">
            <span className="font-semibold text-[15px] tracking-tight text-sidebar-foreground">
              Moja<span className="text-sidebar-primary">Ride</span>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-sidebar-primary/80">
                {t("operator")}
              </span>
              {status && (
                <>
                  <span className="text-[9px] text-sidebar-foreground/30">
                    •
                  </span>
                  <span
                    className={cn(
                      "text-[8px] font-extrabold uppercase tracking-wider px-1 py-0.2 rounded border shrink-0",
                      statusPresentation.badgeClassName,
                    )}
                  >
                    {statusPresentation.shortLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          <SidebarTrigger className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground lg:hidden" />
        </div>
      </SidebarHeader>

      <div className="mx-3 my-2 border-b border-sidebar-border" />

      <SidebarContent className="px-0">
        <NavSection
          label={t("sections.operations")}
          items={operationsItems}
          pathname={pathname}
          can={can}
        />
        <NavSection
          label={t("sections.planning")}
          items={planningItems}
          pathname={pathname}
          can={can}
        />
        <NavSection
          label={t("sections.fleet")}
          items={fleetItems}
          pathname={pathname}
          can={can}
        />
        <NavSection
          label={t("sections.talent")}
          items={talentItems}
          pathname={pathname}
          can={can}
        />
        <NavSection
          label={t("sections.financials")}
          items={financialsItems}
          pathname={pathname}
          can={can}
        />
        <NavSection
          label={t("sections.growth")}
          items={growthItems}
          pathname={pathname}
          can={can}
        />
        <NavSection
          label={t("sections.organization")}
          items={organizationItems}
          pathname={pathname}
          can={can}
        />
      </SidebarContent>

      <div className="mx-3 my-2 border-b border-sidebar-border" />

      {/* Cross-dashboard navigation */}
      <div className="px-3">
        <DashboardSwitcher userRole={user?.role} />
      </div>

      <SidebarFooter className="px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex h-10 w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2",
                  "outline-none transition-colors duration-150 hover:bg-sidebar-accent",
                  "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  "group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                )}
                title={user?.name ?? t("operator")}
              >
                <Avatar className="size-6 shrink-0">
                  <AvatarImage
                    src={
                      data?.operator?.profilePhotoUrl ||
                      user?.image ||
                      undefined
                    }
                  />
                  <AvatarFallback className="bg-sidebar-primary/15 text-[10px] font-semibold text-sidebar-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-[13px] font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                  {user?.name ?? user?.email ?? t("operator")}
                </span>
                <ChevronsUpDown className="ml-auto size-3.5 text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 border-border bg-popover"
              >
                <div className="px-2 py-1.5">
                   <p className="truncate text-xs font-medium text-popover-foreground">
                     {user?.name}
                   </p>
                   {user?.role === "ADMIN" ? (
                     <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-500/10 rounded px-1.5 py-0.5 mt-0.5">
                       <Shield className="size-3" />
                       {t("platformAdmin")}
                     </span>
                   ) : null}
                   <p className="truncate text-xs text-muted-foreground">
                     {user?.email}
                   </p>
                 </div>
                <DropdownMenuSeparator className="bg-border" />
                {can("company:view") ? (
                  <DropdownMenuItem
                    className="cursor-pointer text-popover-foreground/80 hover:text-popover-foreground"
                    render={<Link href="/dashboard/operator/settings" />}
                  >
                    <Settings className="mr-2 size-4 text-muted-foreground" />
                    {t("settings")}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive hover:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
