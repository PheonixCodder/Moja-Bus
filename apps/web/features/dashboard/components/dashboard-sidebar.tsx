"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type LucideIcon,
  BusFront,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Ticket,
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
import type { User } from "@/lib/auth-client";

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
        <SidebarGroupLabel className="px-3 mb-1 text-[11px] uppercase tracking-widest text-text-muted">
          {label}
        </SidebarGroupLabel>
      ) : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              pathname === item.url || pathname.startsWith(`${item.url}/`);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.title}
                  className={cn(
                    "h-9 rounded-md border border-transparent px-3 py-2 text-[13px] font-medium tracking-tight transition-colors duration-150",
                    "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
                    isActive &&
                      "border-neon/20 bg-neon/5 text-neon hover:bg-neon/5 hover:text-neon",
                  )}
                  render={
                    <Link href={item.url}>
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-neon" : "text-text-muted",
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

interface DashboardSidebarProps {
  user: User | null;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const { signOut } = useAuth();

  const mainMenuItems: MenuItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Search trips", url: "/dashboard/search", icon: Search },
    { title: "Bookings", url: "/dashboard/bookings", icon: CalendarDays },
    { title: "Tickets", url: "/dashboard/tickets", icon: Ticket },
  ];

  const otherMenuItems: MenuItem[] = [
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ];

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MB";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-bg-surface"
    >
      <SidebarHeader className="flex flex-col gap-4 px-3 pt-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center overflow-hidden transition-all duration-300 ease-in-out",
              sidebar.state === "collapsed" &&
                "group cursor-pointer rounded-md hover:bg-bg-elevated",
            )}
          >
            {sidebar.state === "collapsed" ? (
              <>
                <SidebarTrigger
                  className={cn(
                    "flex h-full items-center justify-center p-0 text-text-muted transition-all duration-300 ease-in-out",
                    "w-0 scale-90 opacity-0 group-hover:w-full group-hover:scale-100 group-hover:opacity-100",
                    "hover:text-text-primary",
                  )}
                />
                <BusFront
                  className={cn(
                    "size-5 shrink-0 text-neon transition-all duration-300 ease-in-out",
                    "group-hover:w-0 group-hover:scale-75 group-hover:opacity-0",
                  )}
                />
              </>
            ) : (
              <BusFront className="size-5 text-neon" />
            )}
          </div>

          <span className="font-semibold text-base tracking-tight text-text-primary group-data-[collapsible=icon]:hidden">
            Moja
            <span className="text-neon">Ride</span>
          </span>

          <SidebarTrigger className="ml-auto text-text-muted hover:text-text-primary lg:hidden" />
        </div>
      </SidebarHeader>

      <div className="mx-3 my-2 border-b border-border border-dashed" />

      <SidebarContent className="px-0">
        <NavSection items={mainMenuItems} pathname={pathname} />
        <NavSection
          label="Account"
          items={otherMenuItems}
          pathname={pathname}
        />
      </SidebarContent>

      <div className="mx-3 my-2 border-b border-border border-dashed" />

      <SidebarFooter className="px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-md border border-border bg-bg-elevated px-2",
                  "outline-none transition-colors duration-150 hover:border-border-strong",
                  "focus-visible:ring-2 focus-visible:ring-neon",
                  "group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                )}
                title={user?.name ?? "Account"}
              >
                <Avatar className="size-5 shrink-0">
                  <AvatarFallback className="bg-neon/10 text-[10px] font-semibold text-neon">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-[13px] font-medium text-text-primary group-data-[collapsible=icon]:hidden">
                  {user?.name ?? user?.email ?? "Account"}
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 border-border bg-bg-surface"
              >
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium text-text-primary">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  className="cursor-pointer text-text-secondary hover:text-text-primary"
                  render={<Link href="/dashboard/settings" />}
                >
                  <Settings className="mr-2 size-4 text-text-muted" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-error focus:bg-error/10 focus:text-error hover:text-error"
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
