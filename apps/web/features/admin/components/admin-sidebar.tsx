"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type LucideIcon,
  LogOut,
  Settings,
  Gauge,
  ChevronsUpDown,
  Users,
  ShieldCheck,
  Activity,
  Landmark,
  Coins,
  FileText,
  Scale,
  Briefcase,
  Route,
  BarChart2,
  Link as LinkIcon,
  History,
  Shield,
  Webhook,
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@moja/ui/lib/utils";
import { Avatar, AvatarFallback } from "@moja/ui/components/ui/avatar";
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
import type { User as AuthUser } from "@/lib/auth-client";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavSectionProps {
  label?: string;
  items: MenuItem[];
  pathname: string;
}

function NavSection({ label, items, pathname }: NavSectionProps) {
  return (
    <SidebarGroup>
      {label ? (
        <SidebarGroupLabel className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          {label}
        </SidebarGroupLabel>
      ) : null}
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map((item) => {
            const isActive =
              item.url === "/dashboard/admin"
                ? pathname === item.url
                : pathname.startsWith(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.title}
                  className={cn(
                    "h-9 rounded-md border border-transparent px-3 py-2 text-[13px] font-medium tracking-tight transition-colors duration-150",
                    "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive &&
                      "border-sidebar-primary/15 bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/10 hover:text-sidebar-primary",
                  )}
                  render={
                    <Link href={item.url}>
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/40",
                        )}
                      />
                      <span>{item.title}</span>
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

interface AdminSidebarProps {
  user: AuthUser | null;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const { signOut } = useAuth();

  const overviewItems: MenuItem[] = [
    { title: "Overview", url: "/dashboard/admin", icon: Gauge },
  ];

  const financialItems: MenuItem[] = [
    { title: "Ledger", url: "/dashboard/admin/financials/ledger", icon: Scale },
    { title: "Settlements", url: "/dashboard/admin/financials/settlements", icon: Landmark },
    { title: "Withdrawals", url: "/dashboard/admin/financials/withdrawals", icon: Coins },
  ];

  const operationsItems: MenuItem[] = [
    { title: "Live Dispatch", url: "/dashboard/admin/operations/dispatch", icon: Activity },
    { title: "Routes", url: "/dashboard/admin/operations/routes", icon: Route },
  ];

  const contentItems: MenuItem[] = [
    { title: "Posts", url: "/dashboard/admin/content/posts", icon: FileText },
    { title: "Analytics", url: "/dashboard/admin/content/analytics", icon: BarChart2 },
    { title: "Redirects", url: "/dashboard/admin/content/redirects", icon: LinkIcon },
  ];

  const auditItems: MenuItem[] = [
    { title: "Activity Logs", url: "/dashboard/admin/audit-logs/activity", icon: History },
    { title: "Bank Access Logs", url: "/dashboard/admin/audit-logs/bank-access", icon: Shield },
    { title: "Webhook Events", url: "/dashboard/admin/audit-logs/webhooks", icon: Webhook },
  ];

  const platformItems: MenuItem[] = [
    { title: "Verification Queue", url: "/dashboard/admin/verifications", icon: ShieldCheck },
    { title: "Settings", url: "/dashboard/admin/settings", icon: Settings },
  ];

  const directoryItems: MenuItem[] = [
    { title: "Travelers", url: "/dashboard/admin/users/travelers", icon: Users },
    { title: "Operators", url: "/dashboard/admin/users/operators", icon: Briefcase },
  ];

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

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
                <ShieldCheck
                  className={cn(
                    "size-4.5 shrink-0 text-sidebar-primary transition-all duration-300 ease-in-out",
                    "group-hover:w-0 group-hover:scale-75 group-hover:opacity-0",
                  )}
                />
              </>
            ) : (
              <ShieldCheck className="size-4.5 text-sidebar-primary" />
            )}
          </div>

          <div className="group-data-[collapsible=icon]:hidden flex flex-col">
            <span className="font-semibold text-[15px] tracking-tight text-sidebar-foreground">
              Moja<span className="text-sidebar-primary">Ride</span>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-sidebar-primary/85 px-1 py-0.2 bg-sidebar-primary/10 rounded">
                Admin
              </span>
            </div>
          </div>

          <SidebarTrigger className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground lg:hidden" />
        </div>
      </SidebarHeader>

      <div className="mx-3 my-2 border-b border-sidebar-border" />

      <SidebarContent className="px-0">
        <NavSection
          items={overviewItems}
          pathname={pathname}
        />
        <NavSection
          label="Financials"
          items={financialItems}
          pathname={pathname}
        />
        <NavSection
          label="Operations"
          items={operationsItems}
          pathname={pathname}
        />
        <NavSection
          label="Directory"
          items={directoryItems}
          pathname={pathname}
        />
        <NavSection
          label="Content"
          items={contentItems}
          pathname={pathname}
        />
        <NavSection
          label="Audit & Security"
          items={auditItems}
          pathname={pathname}
        />
        <NavSection
          label="Platform"
          items={platformItems}
          pathname={pathname}
        />
      </SidebarContent>

      <div className="mx-3 my-2 border-b border-sidebar-border" />

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
                title={user?.name ?? "Account"}
              >
                <Avatar className="size-6 shrink-0">
                  <AvatarFallback className="bg-sidebar-primary/15 text-[10px] font-semibold text-sidebar-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-[13px] font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                  {user?.name ?? user?.email ?? "Admin"}
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
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  className="cursor-pointer text-popover-foreground/80 hover:text-popover-foreground"
                  render={<Link href="/dashboard/admin/settings" />}
                >
                  <Settings className="mr-2 size-4 text-muted-foreground" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive hover:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
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
