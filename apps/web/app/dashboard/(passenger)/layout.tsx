import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { Button } from "@moja/ui/components/ui/button";
import { TooltipProvider } from "@moja/ui/components/ui/tooltip";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { SearchDialog } from "@/features/dashboard/components/search-dialog";
import { getUser, requireServerSession } from "@/lib/auth-server";
import { NotificationInbox } from "@/features/notifications/components/notification-inbox";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireServerSession();

  const user = await getUser();
  if (user?.role === "TRAVELER" && !user.name) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 68)",
          } as React.CSSProperties
        }
      >
        <DashboardSidebar user={user} />
        <SidebarInset className="min-w-0 overflow-x-clip min-h-0 flex flex-col bg-background">
          {/* Header matches best-dashboard-setup layout header */}
          <header className="flex h-12 shrink-0 items-center gap-2 border-b sticky top-0 z-50 bg-background/50 backdrop-blur-md transition-all">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
                />
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                {/* Layout matching mock buttons */}
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                  <Settings className="size-4" />
                </Button>
                <div className="h-4 w-px bg-border/80 mx-1" />
                <NotificationInbox />
              </div>
            </div>
          </header>

          {/* Content Pane */}
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden bg-background">
            {children}
          </div>
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
