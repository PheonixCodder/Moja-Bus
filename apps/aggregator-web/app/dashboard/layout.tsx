import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { SidebarInset, SidebarProvider } from "@moja/ui/components/ui/sidebar";
import { TooltipProvider } from "@moja/ui/components/ui/tooltip";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { getUser, requireServerSession } from "@/lib/auth-server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireServerSession();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const user = await getUser();

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
        <DashboardSidebar user={user} />
        <SidebarInset className="min-h-0 min-w-0 bg-bg-base">
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
