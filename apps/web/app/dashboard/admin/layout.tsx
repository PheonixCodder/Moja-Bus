import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@moja/ui/components/ui/sidebar";
import { TooltipProvider } from "@moja/ui/components/ui/tooltip";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { getServerSession, getUser } from "@/lib/auth-server";
import { NotificationInbox } from "@/features/notifications/components/notification-inbox";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.session) {
    redirect("/login");
  }

  const role = session.user?.role || "TRAVELER";

  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const fullUser = await getUser();

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
        <AdminSidebar user={fullUser} />
        <SidebarInset className="min-h-0 min-w-0 bg-bg-base relative">
          <div className="absolute right-4 top-1.5 z-40">
            <NotificationInbox />
          </div>
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
