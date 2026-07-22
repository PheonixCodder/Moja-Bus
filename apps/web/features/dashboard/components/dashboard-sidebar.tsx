"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type LucideIcon,
  BusFront,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  Ticket,
  Users,
  Wallet,
  EllipsisVertical,
  CircleUser,
  LifeBuoy
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@moja/ui/lib/utils";
import { Avatar, AvatarFallback } from "@moja/ui/components/ui/avatar";
import { Card, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  useSidebar,
} from "@moja/ui/components/ui/sidebar";
import type { User } from "@/lib/auth-client";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  user: User | null;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const { signOut } = useAuth();

  const mainMenuItems: MenuItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Bookings", url: "/dashboard/bookings", icon: CalendarDays },
    { title: "Tickets", url: "/dashboard/tickets", icon: Ticket },
    { title: "Wallet", url: "/dashboard/wallet", icon: Wallet },
    { title: "Passengers", url: "/dashboard/passengers", icon: Users },
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Header section matches best-dashboard-setup exactly */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="default" render={
              <Link prefetch={false} href="/dashboard" className="flex items-center gap-2">
                <BusFront className="size-4 text-primary" />
                <span className="font-semibold text-base tracking-tight text-sidebar-foreground">
                  Moja<span className="text-primary font-bold">Ride</span>
                </span>
              </Link>
            } tooltip="Moja Ride" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Passenger Menu Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
            Dashboards
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/dashboard" && pathname.startsWith(item.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={
                        <Link href={item.url}>
                          <item.icon className="size-4 shrink-0" />
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

        {/* Secondary Account Menu Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherMenuItems.map((item) => {
                const isActive = pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={
                        <Link href={item.url}>
                          <item.icon className="size-4 shrink-0" />
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
      </SidebarContent>

      <SidebarFooter className="gap-4">
        {/* Replicated sidebar support card for Travelers */}
        <Card className="overflow-hidden shadow-none border border-sidebar-border bg-sidebar group-data-[collapsible=icon]:hidden mx-2">
          <CardHeader className="min-w-0 p-3">
            <CardTitle className="truncate text-xs font-semibold text-sidebar-foreground flex items-center gap-1.5">
              <LifeBuoy className="size-3.5 text-primary" /> Need booking support?
            </CardTitle>
            <CardDescription className="line-clamp-2 text-[10px] text-muted-foreground leading-normal mt-1">
              Contact us at support@mojaride.com for help.
            </CardDescription>
          </CardHeader>
        </Card>

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full flex items-center gap-2 p-2 rounded-md transition-colors"
                  >
                    <Avatar className="h-8 w-8 rounded-lg grayscale shrink-0">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden min-w-0">
                      <span className="truncate font-medium text-sidebar-foreground">
                        {user?.name ?? "Guest User"}
                      </span>
                      <span className="truncate text-muted-foreground text-xs">
                        {user?.email ?? user?.phoneNumber ?? "No contact details"}
                      </span>
                    </div>
                    <EllipsisVertical className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden text-muted-foreground" />
                  </SidebarMenuButton>
                }
              />

              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg border border-sidebar-border bg-sidebar"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                        <span className="truncate font-medium text-sidebar-foreground">
                          {user?.name ?? "Guest User"}
                        </span>
                        <span className="truncate text-muted-foreground text-xs">
                          {user?.email ?? user?.phoneNumber}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-sidebar-border" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    render={
                      <Link href="/dashboard/settings" className="flex w-full items-center gap-2">
                        <CircleUser className="size-4 text-muted-foreground" />
                        Account Settings
                      </Link>
                    }
                  />
                  <DropdownMenuItem
                    render={
                      <Link href="/dashboard/wallet" className="flex w-full items-center gap-2">
                        <Wallet className="size-4 text-muted-foreground" />
                        Wallet Ledger
                      </Link>
                    }
                  />
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-sidebar-border" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive hover:text-destructive"
                >
                  <LogOut className="size-4 mr-2" />
                  <span>Sign out</span>
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
